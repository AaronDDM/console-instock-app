const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const aws = require("aws-sdk");

const DEBUG = process.env.DEBUG || false;
const TABLE_NAME = process.env.TABLE_NAME || "buy-bot-state-table";
const AWS_REGION = process.env.AWS_REGION || "ca-central-1";
const DISCORD_NOTIFICATION_URL = process.env.DISCORD_NOTIFICATION_URL || "https://discord.com/api/webhooks/884907776135008326/SzZY7S4axSxi7AeNaREGtpn_ozRrCuSAxNOvTQWeOLDhaz8M9fsy3MvJEW3eiH-L9blz";
const DISCORD_BOT_STATUS_CHECK_URL = "https://discord.com/api/webhooks/888206072450531328/Y3yVNXUrAEpfsA8UK02Cs3ZwnFL5Vv8SngOH7b90zzFTS8XI8uZIdGW_pOubsVLWiToH";

const db = new aws.DynamoDB.DocumentClient({ region: AWS_REGION });
const consoles = {
    "8WJ714N3RBTL/490G/8W0DZS99WPZZ": {
        name: "XBOX Series X",
        url: "https://www.xbox.com/en-ca/configure/8WJ714N3RBTL",
        description: "Go go go! You can [visit your cart](https://www.microsoft.com/en-ca/store/cart) or go to the [configure page](https://www.xbox.com/en-ca/configure/8WJ714N3RBTL) directly.",
        image_url: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4mRni?ver=8361&q=90&o=f&w=400&h=400",
        color: 6144542,
        author: {
            "name": "Microsoft",
            "icon_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/1200px-Xbox_one_logo.svg.png"
        },
    },
    "8RPM8T9CK0P6/GSTK/8WTZMJQ0DKPM": {
        name: "Xbox Series X – Halo Infinite Limited Edition Bundle",
        url: "https://www.xbox.com/en-ca/configure/8RPM8T9CK0P6",
        description: "Go go go! You can [visit your cart](https://www.microsoft.com/en-ca/store/cart) or go to the [configure page](https://www.xbox.com/en-ca/configure/8RPM8T9CK0P6) directly.",
        image_url: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWJbVk?ver=9a01&q=90&o=f&w=400&h=400",
        color: 12164199,
        author: {
            "name": "Microsoft",
            "icon_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/1200px-Xbox_one_logo.svg.png"
        },
    }
}

async function microsoft_canada_store() {
    return fetch("https://cart.production.store-web.dynamics.com/cart/v1.0/Cart/checkProductInventory?market=CA&appId=storeCart", {
        method: "PUT",
        headers: {
            'authority': 'cart.production.store-web.dynamics.com',
            'pragma': 'no-cache',
            'cache-control': 'no-cache',
            'sec-ch-ua': '"Chromium";v="94", "Google Chrome";v="94", ";Not A Brand";v="99"',
            'x-authorization-muid': '89GKE2K84A4D22F00154F6256K5163K9',
            'dnt': '1',
            'sec-ch-ua-mobile': '?0',
            'content-type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
            'ms-cv': 'nOMNS4rgrDEzYpFs.0.2',
            'sec-ch-ua-platform': '"macOS"',
            'accept': '*/*',
            'origin': 'https://www.microsoft.com'
        },
        body: JSON.stringify(
            {
                "itemsToCheck": [
                    {
                        "productId": "8WJ714N3RBTL",
                        "availabilityId": "8W0DZS99WPZZ",
                        "skuId": "490G",
                        "distributorId": "9000000013",
                        "isPreOrder": false
                    },
                    {
                        "productId": "8RPM8T9CK0P6",
                        "availabilityId": "8WTZMJQ0DKPM",
                        "skuId": "GSTK",
                        "distributorId": "9000000013",
                        "isPreOrder": false
                    }
                ]
            }
        )
    })
        .then((response) => response.json())
        .then(async (json) => {
            console.debug(`#> Debug status check: ${JSON.stringify(json)}`);
            const product_inventory = json?.productInventory || {};
            const ids = Object.keys(product_inventory);

            if (ids.length === 0) {
                return [];
            }

            let items = []
            for (const id of ids) {
                for (const dist of product_inventory[id]) {
                    items.push({
                        id,
                        in_stock: dist?.inStock
                    })
                }
            }

            return items;
        })
        .catch(async (error) => {
            console.error(`#> Error occurred while checking stock status`, error);
            await send_discord_notification(DISCORD_BOT_STATUS_CHECK_URL, {
                content: "Microsot Canada Store Error: ```json" + "\n" + JSON.stringify(error, null, 4) + "```"
            });    
            return [];
        })
}

async function send_discord_notification(url, body) {
    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
        .then((response) => response.text());
}

exports.lambdaHandler = async (event, context) => {
    console.debug(`#> Starting stock check`);

    let embeds = [];
    let items = [];

    const microsot_store_items = await microsoft_canada_store();
    items = [...items, ...microsot_store_items];

    await send_discord_notification(DISCORD_BOT_STATUS_CHECK_URL, {
        content: "Doing a stock cehck: ```json" + "\n" + JSON.stringify(items, null, 4) + "```"
    });    

    for (const item of items) {
        const console = consoles[item.id];
        if (!console) {
            console.error(`#> Error occurred while checking stock status`, item);
            continue;
        }

        const is_in_stock = item.in_stock;
        const current_console_state = await db.get({ TableName: TABLE_NAME, Key: { "console": item.id } }).promise();
        const has_changed_state = (current_console_state.Item?.is_in_stock !== is_in_stock);
        
        if (is_in_stock && has_changed_state) {
            embeds.push(                        {
                "author": console.author,
                "title": console.name,
                "url": console.url,
                "description": console.description,
                "color": console.color,
                "image": {
                    "url": console.image_url
                }
            })
        }

        if (has_changed_state) {
            const today = new Date();
            const updated_at = today.toUTCString();

            let Item = { "console": item.id, is_in_stock, updated_at, last_in_stock_at: current_console_state.Item?.last_in_stock_at || "" };
            if (is_in_stock) {
                Item["last_in_stock_at"] = today.toUTCString();
            }

            await db.put({ TableName: TABLE_NAME, Item }).promise();
        }
    }
    

    if (embeds.length > 0) {
        console.debug(`#> Sending discord notification`);
        try {
            const discord_response = await send_discord_notification(
                DEBUG ? DISCORD_BOT_STATUS_CHECK_URL : DISCORD_NOTIFICATION_URL,
                {
                    "content": DEBUG ? "This is a test. Please Ignore" : "<@231454366236803085> New Console Stock Notification!",
                    "embeds": embeds
                }
            );
            console.debug(`#> Dicord response: `, discord_response);
        } catch (error) {
            console.error(`#> Error sending discord notification: ${error}`);
        }
    }

    return true;
}