const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const aws = require("aws-sdk");

const CONSOLE = "xbox-series-x";
const TABLE_NAME = process.env.TABLE_NAME || "buy-bot-state-table";
const AWS_REGION = process.env.AWS_REGION || "ca-central-1";
const PURCHASER_LAMBDA_NAME = process.env.PURCHASER_LAMBDA_NAME || "Purchaser";
const DISCORD_NOTIFICATION_URL = process.env.DISCORD_NOTIFICATION_URL || "https://discord.com/api/webhooks/884907776135008326/SzZY7S4axSxi7AeNaREGtpn_ozRrCuSAxNOvTQWeOLDhaz8M9fsy3MvJEW3eiH-L9blz";
const STOCK_CHECK_WEBSITE = "https://inv.mp.microsoft.com/v2.0/inventory/CA";

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
                    "skuId": "490G",
                    "productId": "8WJ714N3RBTL",
                    "availabilityId": "8W0DZS99WPZZ"
                }
            ]
        )
    })
        .then((response) => response.json())
        .then((json) => {
            console.debug(`#> Debug status check: ${JSON.stringify(json)}`);
            if (!("inStock" in json)) {
                return false;
            }
            let in_stock = false;
            const avaibilities = json.availabilities;
            for (let avaibility of avaibilities) {
                const future_lots = avaibility.futureLots;
                const lot_keys = Object.keys(future_lots);

                lot_loop:
                for (let lot_key of lot_keys) {
                    const lot = future_lots[lot_key];
                    const distributor_ids = Object.keys(lot);
                    for (let distributor_id of distributor_ids) {
                        const distributor = lot[distributor_id];
                        in_stock = distributor.inStock !== "False";
                        if (in_stock) {
                            break lot_loop;
                        }
                    }
                }
            }

            return in_stock;
        })
        .catch((error) => {
            console.error(`#> Error occurred while checking stock status`, error);
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
        console.debug(`#> Sending discord notification`);
        try {
            const discord_response = await send_discord_notification(DISCORD_NOTIFICATION_URL, "<@318422857795371008> <@231454366236803085> XBOX Series X IN STOCK https://www.microsoft.com/en-ca/store/buy?pid=8WJ714N3RBTL GO GO GO!");
            console.debug(`#> Dicord response: `, discord_response);
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