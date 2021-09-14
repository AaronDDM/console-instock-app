const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const aws = require("aws-sdk");

const CONSOLE = "xbox-series-x";
const TABLE_NAME = process.env.TABLE_NAME || "buy-bot-state-table";
const AWS_REGION = process.env.AWS_REGION || "ca-central-1";
const PURCHASER_LAMBDA_NAME = process.env.PURCHASER_LAMBDA_NAME || "Purchaser";
const DISCORD_NOTIFICATION_URL = process.env.DISCORD_NOTIFICATION_URL || "https://discord.com/api/webhooks/884907776135008326/SzZY7S4axSxi7AeNaREGtpn_ozRrCuSAxNOvTQWeOLDhaz8M9fsy3MvJEW3eiH-L9blz";
const STOCK_CHECK_WEBSITE = "https://inv.mp.microsoft.com/v2.0/inventory/CA?MS-CorrelationId=eda6903c-a7c9-4b13-8d5c-00d0d571ddad&MS-RequestId=eda6903c-a7c9-4b13-8d5c-00d0d571ddad&mode=continueOnError";

const db = new aws.DynamoDB.DocumentClient({ region: AWS_REGION });

async function get_stock_status(scan_site_url) {
    return fetch(scan_site_url, {
        method: "POST", 
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(
            [
                {
                    "condition": "IsOutOfStock1",
                    "productId": "8WJ714N3RBTL",
                    "skuId": "490G",
                    "inventorySkuId": "RRT-00001",
                    "availabilityId": "8W0DZS99WPZZ",
                    "distributorId": "9000000013"
                }
            ]
        )
    })
        .then((response) => response.json())
        .then((json) => {
            console.debug(`#> Debug status check: ${JSON.stringify(json)}`);
            return "inStock" in json && json.inStock !== "False";
        })
        .catch((error) => {
            console.error(`#> Error occurred while checking stock status: ${error}.`);
            return false;
        })
}

async function send_discord_notification(url, content) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }).then((response) => response.text());
}

exports.lambdaHandler = async (event, context) => {
    console.debug(`#> Starting stock check`);
    const is_in_stock = await get_stock_status(STOCK_CHECK_WEBSITE);
    console.debug(`#> Ended stock check: ${is_in_stock ? "IN_STOCK" : "OUT_OF_STOCK"}`);

    const current_console_state = await db.get({ TableName: TABLE_NAME, Key: { "console": CONSOLE } }).promise();
    const has_changed_state = (current_console_state.Item?.is_in_stock !== is_in_stock);

    // Only notify discord + trigger the purchaser
    // if the console is in stock and we got a state change.
    // This prevents spam + keeps us from purchasing multiple times...
    if (is_in_stock && has_changed_state) {
        // console.debug(`#> Sending discord notification`);
        // try {
        //     const discord_response = await send_discord_notification(DISCORD_NOTIFICATION_URL, "<@318422857795371008> <@231454366236803085> XBOX Series X is in stock at Microsoft Store (Canada)");
        //     console.debug(`#> Dicord response: `, discord_response);
        // } catch (error) {
        //     console.error(`#> Error sending discord notification: ${error}`);
        // }
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

    if (has_changed_state) {
        const today = new Date();
        const updated_at = today.toUTCString();

        let Item = { "console": CONSOLE, is_in_stock, updated_at, last_in_stock_at: current_console_state.Item?.last_in_stock_at || "" };
        if (is_in_stock) {
            Item["last_in_stock_at"] = today.toUTCString();
        }

        await db.put({ TableName: TABLE_NAME, Item }).promise();
        console.debug(`#> Updated the database state`);
    }

    return is_in_stock;
}