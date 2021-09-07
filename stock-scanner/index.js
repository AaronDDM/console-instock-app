const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const jsdom = require("jsdom");
const aws = require("aws-sdk");

const PURCHASER_LAMBDA_NAME = process.env.PURCHASER_LAMBDA_NAME;
const DISCORD_NOTIFICATION_URL = process.env.DISCORD_NOTIFICATION_URL || "https://discord.com/api/webhooks/884907776135008326/SzZY7S4axSxi7AeNaREGtpn_ozRrCuSAxNOvTQWeOLDhaz8M9fsy3MvJEW3eiH-L9blz";
const STOCK_CHECK_WEBSITE = "https://www.nowinstock.net/ca/videogaming/consoles/microsoftxboxseriesx/";

async function get_stock_status(scan_site_url, row_id) {
    const html = await fetch(scan_site_url, { method: "GET" }).then((response) => response.text())
    const htmlDoc = new jsdom.JSDOM(html);
    // #tr53218 points to the Microsoft Store Stock row
    return htmlDoc.window.document.querySelector(`#${row_id} .stockStatus`).textContent.toLowerCase();
}

async function send_discord_notification(url, content) {
    return fetch(url, { method: "POST", body: JSON.stringify({ content }) });
}

exports.lambdaHandler = async (event, context) => {
    console.debug(`#> Starting stock check`);
    const is_in_stock = (await get_stock_status(STOCK_CHECK_WEBSITE, "tr53218")) !== "out of stock";
    console.debug(`#> Ended stock check: ${is_in_stock ? "IN_STOCK" : "OUT_OF_STOCK"}`);
    if (is_in_stock) {
        console.debug(`#> Sending discord notification`);
        await send_discord_notification(DISCORD_NOTIFICATION_URL, "@everyone XBOX Series X is in Stock at Microsoft Store (Canada)");
        console.debug(`#> Sent discord notification`);
        console.debug(`#> Starting puchaser lambda invocation`);
        // Invoke our purchaser lambda.
        // This is technically not recommended - you should use SNS or a step function
        // but we're not trying to hit some prod capabilities here.
        // Invoking via async prevents us from being charged big monies.
        const lambda = new aws.Lambda();
        lambda.invokeAsync({ FunctionName: PURCHASER_LAMBDA_NAME, Payload: JSON.stringify({ is_in_stock }) });
        console.debug(`#> Completed puchaser lambda invocation`);
    }
    return is_in_stock;
}