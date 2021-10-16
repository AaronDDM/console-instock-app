import { microsoft_canada_store_v2 } from '../checker/microsoft-canada-store-v2';
import config from '../config';
import global_state from '../state/db-state';
import send_discord_notification from '../utils/send-discord-notification';
import send_stock_notification from "../utils/send-stock-notification";

export async function handler() {
    console.debug(`#> [handler] Started`)
    const promises = [];
    const checkers = [microsoft_canada_store_v2]
    for (const checkItems of checkers) {
        promises.push(new Promise(async (resolve, reject) => {
            console.debug(`#> [handler, checkItem] Started`)
            const items = await checkItems();
            await send_discord_notification(config.DISCORD_BOT_STATUS_CHECK_URL, {
                content: "Doing a stock check: ```json" + "\n" + JSON.stringify(items, null, 4) + "```"
            });
            await send_stock_notification(items, global_state);
            console.debug(`#> [handler, checkItem] Ended`)

            resolve(true);
        }));
    }
    await Promise.all(promises);
    console.debug(`#> [handler] Ended`)
    return true;
}