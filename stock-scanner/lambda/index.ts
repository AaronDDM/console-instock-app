import { microsoft_canada_store_v2 } from '../checker/microsoft-canada-store-v2';
import config from '../config';
import global_state from '../state/db-state';
import { CheckItem } from '../types';
import send_discord_notification from '../utils/send-discord-notification';
import send_stock_notification from "../utils/send-stock-notification";

export async function handler() {
    console.debug(`#> [handler] Started`)
    const promises = [];
    const checkers: Array<() => Promise<Array<CheckItem>>> = [microsoft_canada_store_v2]
    for (const checkItems of checkers) {
        promises.push(new Promise(async (resolve) => {
            console.debug(`#> [handler, checkItem] Started`)
            let items = await checkItems();
            await send_discord_notification(config.DISCORD_BOT_STATUS_CHECK_URL, {
                content: "Doing a stock check: ```json" + "\n" + JSON.stringify(items, null, 4) + "```"
            });
            await send_stock_notification(config.DEBUG ? "This is a test. Please Ignore" : "<@231454366236803085> New Console Stock Notification!", items, global_state);
            console.debug(`#> [handler, checkItem] Ended`);

            items = [];

            resolve(true);
        }));
    }
    await Promise.all(promises);
    console.debug(`#> [handler] Ended`)
    return true;
}