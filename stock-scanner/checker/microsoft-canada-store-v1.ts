import fetch from "node-fetch";
import config from "../config";
import send_discord_notification from "../utils/send-discord-notification";
import { CheckItem } from "../types";

const charset =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export async function microsoft_canada_store(): Promise<Array<CheckItem>> {
    return fetch("https://cart.production.store-web.dynamics.com/cart/v1.0/Cart/checkProductInventory?market=CA&appId=storeCart", {
        method: "PUT",
        headers: {
            'authority': 'cart.production.store-web.dynamics.com',
            'pragma': 'no-cache',
            'cache-control': 'no-cache',
            'sec-ch-ua': '"Chromium";v="94", "Google Chrome";v="94", ";Not A Brand";v="99"',
            'x-authorization-muid': [...Array(32)].map((_) => charset[Math.floor(Math.random() * charset.length)]).join("").toUpperCase(),
            'dnt': '1',
            'sec-ch-ua-mobile': '?0',
            'content-type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
            'ms-cv': Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 105)+'.0.2',
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
        .then(async (response) => {
            if (response.status !== 200) {
                throw new Error(`Error #${response.status} - ${await response.text()}`);
            }
            return response.json();
        })
        .then(async (json: any) => {
            console.debug(`#> [microsoft_canada_store_v2] Debug status check: ${JSON.stringify(json)}`);
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
            console.error(`#> [microsoft_canada_store_v1] Error occurred while checking stock status`, error);
            await send_discord_notification(config.DISCORD_BOT_STATUS_CHECK_URL, {
                content: "Microsot Canada Store Error: ```" + error.toString() + "```"
            });    
            return [];
        })
}