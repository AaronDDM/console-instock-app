import { microsoft_canada_store_v2 } from '../checker/microsoft-canada-store-v2';
import config from '../config';
import global_state from '../state/memory-state';
import { CheckItem } from '../types';
import send_stock_notification from "../utils/send-stock-notification";
import keepAlive from "./server";

keepAlive();

function convertTZ(date: Date, tzString: string) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
}

setInterval(async () => {
    console.debug(`#> [handler] Started`)
    const today = convertTZ(new Date(), 'America/New_York');
    console.log(`#> [handler] Date: ${today.toDateString()}`)
    if (today.getDay() === 4) {
        const promises = [];
        const checkers: Array<() => Promise<Array<CheckItem>>> = [microsoft_canada_store_v2]
        for (const checkItems of checkers) {
            promises.push(new Promise(async (resolve) => {
                console.debug(`#> [handler, checkItem] Started`)
                let items = await checkItems();
                // await send_discord_notification(config.DISCORD_BOT_STATUS_CHECK_URL, {
                //     content: "Repl.it Check: ```json" + "\n" + JSON.stringify(items, null, 4) + "```"
                // });
                await send_stock_notification(config.DEBUG ? "This is a test. Please Ignore" : "5-sec bot here, new XBOX drop!", items, global_state);
                console.debug(`#> [handler, checkItem] Ended`);

                items = [];

                resolve(true);
            }));
        }
        await Promise.all(promises);
    }
    console.debug(`#> [handler] Ended`)
    return true;
}, 5000);