import fetch from "node-fetch";
import config from "../config";
import send_discord_notification from "../utils/send-discord-notification";
import { CheckItem } from "../types";

export async function microsoft_canada_store_v2(): Promise<Array<CheckItem>> {
    return fetch("https://inv.mp.microsoft.com/v2.0/inventory/CA", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(
            [
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
        let items: Record<string, CheckItem> = {};
        const avaibilities = json.availabilities;
        for (let avaibility of avaibilities) {
            const id = `${avaibility.productId}/${avaibility.catalogSkuId}/${avaibility.availabilityId}`;
            const available_lots = avaibility.availableLots;
            const available_lot_keys = Object.keys(available_lots);
            for (let lot_key of available_lot_keys) {
                const lot = available_lots[lot_key];
                const distributor_ids = Object.keys(lot);
                for (let distributor_id of distributor_ids) {
                    const distributor = lot[distributor_id];
                    const in_stock = distributor.inStock !== "False";
                    items[id] = {
                        id,
                        in_stock
                    };
                }
            }

            const future_lots = avaibility.futureLots;
            const future_lot_keys = Object.keys(future_lots);
            for (let lot_key of future_lot_keys) {
                const lot = future_lots[lot_key];
                const distributor_ids = Object.keys(lot);
                for (let distributor_id of distributor_ids) {
                    const distributor = lot[distributor_id];
                    const in_stock = distributor.inStock !== "False";
                    items[id] = {
                        id,
                        in_stock
                    };
                }
            }
        }
        return Object.values(items);
    })        
    .catch(async (error) => {
        console.error(`#> [microsoft_canada_store_v2] Error occurred while checking stock status (v2)`, error);
        await send_discord_notification(config.DISCORD_BOT_STATUS_CHECK_URL, {
            content: "Microsot Canada Store V2 Error: ```" + error.toString() + "```"
        });    
        return [];
    })
}