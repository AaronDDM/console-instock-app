import config from "../config";
import global_state from '../state/db-state';
import { CheckItem } from "../types";
import send_discord_notification from "./send-discord-notification";

export default async function send_stock_notifications(items: Array<CheckItem>, state: typeof global_state) {
    console.debug(`#> [send_stock_notification] Started`);

    let embeds = [];
    for (const item of items) {
        const consleItem = config.CONSOLES[item.id as keyof typeof config.CONSOLES];
        if (!consleItem) {
            console.error(`#> [send_stock_notification] Error occurred while checking stock status`, item);
            continue;
        }

        const is_in_stock = item.in_stock;
        const current_console_state = await state.getState(item.id);
        const has_changed_state = (current_console_state?.is_in_stock !== is_in_stock);
        
        if (is_in_stock && has_changed_state) {
            embeds.push(                        {
                "author": consleItem.author,
                "title": consleItem.name,
                "url": consleItem.url,
                "description": consleItem.description,
                "color": consleItem.color,
                "image": {
                    "url": consleItem.image_url
                }
            })
        }

        if (has_changed_state) {
            await state.updateState(item.id, is_in_stock);
        }
    }
    

    if (embeds.length > 0) {
        console.debug(`#> [send_stock_notification] Sending discord notification`);
        try {
            const discord_response = await send_discord_notification(
                config.DEBUG ? config.DISCORD_BOT_STATUS_CHECK_URL : config.DISCORD_NOTIFICATION_URL,
                {
                    "content": config.DEBUG ? "This is a test. Please Ignore" : "<@231454366236803085> New Console Stock Notification!",
                    "embeds": embeds
                }
            );
            console.debug(`#> [send_stock_notification] Dicord response: `, discord_response);
        } catch (error) {
            console.error(`#> [send_stock_notification] Error sending discord notification: ${error}`);
        }
    }

    console.debug(`#> [send_stock_notification] Ended`);
}