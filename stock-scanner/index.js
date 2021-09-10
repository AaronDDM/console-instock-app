const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const jsdom = require("jsdom");
const aws = require("aws-sdk");

const AWS_REGION = process.env.AWS_REGION || "ca-central-1";
const PURCHASER_LAMBDA_NAME = process.env.PURCHASER_LAMBDA_NAME || "Purchaser";
const DISCORD_NOTIFICATION_URL = process.env.DISCORD_NOTIFICATION_URL || "https://discord.com/api/webhooks/884907776135008326/SzZY7S4axSxi7AeNaREGtpn_ozRrCuSAxNOvTQWeOLDhaz8M9fsy3MvJEW3eiH-L9blz";
const STOCK_CHECK_WEBSITE = "https://www.xbox.com/en-ca/configure/8WJ714N3RBTL";

async function get_stock_status(scan_site_url) {
    const html = await fetch(scan_site_url, { method: "GET" }).then((response) => response.text())
    const html_doc = new jsdom.JSDOM(html);
    const button_text = html_doc.window.document.querySelector(`button[aria-label="Checkout bundle"]`).textContent.toLowerCase();
    console.debug(`#> Button text: ${button_text}`);
    return button_text;
}

async function send_discord_notification(url, content) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }).then((response) => response.json());
}

exports.lambdaHandler = async (event, context) => {
    console.debug(`#> Starting stock check`);
    const is_in_stock = (await get_stock_status(STOCK_CHECK_WEBSITE)) !== "out of stock";
    console.debug(`#> Ended stock check: ${is_in_stock ? "IN_STOCK" : "OUT_OF_STOCK"}`);
    if (is_in_stock) {
        console.debug(`#> Sending discord notification`);
        try {
            const discord_response = await send_discord_notification(DISCORD_NOTIFICATION_URL, "<@318422857795371008> <@231454366236803085> XBOX Series X is in Stock at Microsoft Store (Canada)");
            console.debug(`#> Dicord response: `, JSON.stringify(discord_response));
        } catch (error) {
            console.error(`#> Error sending discord notification: ${error}`);
        }
        console.debug(`#> Sent discord notification`);
        console.debug(`#> Starting puchaser lambda invocation`);
        // Invoke our purchaser lambda.
        // This is technically not recommended - you should use SNS or a step function
        // but we're not trying to hit some prod capabilities here.
        // Invoking via async prevents us from being charged big monies.
        const lambda = new aws.Lambda({ region: AWS_REGION });
        lambda.invokeAsync({ FunctionName: PURCHASER_LAMBDA_NAME, InvokeArgs: JSON.stringify({ is_in_stock }) }, (err) => {
            if (err) {
                console.error(`#> lambda.invokeAsync Error: ${err}`);
            }
        });
        console.debug(`#> Completed puchaser lambda invocation`);
    }
    return is_in_stock;
}