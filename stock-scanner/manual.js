const fetch = require("node-fetch")
const keepAlive = require("./server")

const CONSOLE = "xbox-series-x";
const DISCORD_NOTIFICATION_URL = process.env.DISCORD_NOTIFICATION_URL || "https://discord.com/api/webhooks/884907776135008326/SzZY7S4axSxi7AeNaREGtpn_ozRrCuSAxNOvTQWeOLDhaz8M9fsy3MvJEW3eiH-L9blz";
const STOCK_CHECK_WEBSITE = "https://inv.mp.microsoft.com/v2.0/inventory/CA";

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
                    "availabilityId": "8W0DZS99WPZZ",
                    "distributorId": "9000000013"
                }
            ]
        )
    })
        .then((response) => response.json())
        .then(async (json) => {
            console.debug(`#> Debug status check: ${JSON.stringify(json)}`);

            let log_object = [];
            if (!("inStock" in json)) {
                console.debug(`#> Debug status check: Could not find "inStock" property.`);
                return [false, [{ message: "Unable to find parent inStock property." }]];
            }

            // We should probably just return inStock if our global value
            // is in stock, yeah?
            if (json.inStock !== "False") {
                console.debug(`#> Debug status check: IN-STOCK! Parent inStock is True!`);
                return [true, [{ message: "Parent inStock property is True!" }]];
            }

            let in_stock = false;
            const avaibilities = json.availabilities;
            for (let avaibility of avaibilities) {
                const future_lots = avaibility.futureLots;
                const future_lot_keys = Object.keys(future_lots);
                future_lot_loop:
                for (let lot_key of future_lot_keys) {
                    const lot = future_lots[lot_key];
                    const distributor_ids = Object.keys(lot);
                    for (let distributor_id of distributor_ids) {
                        const distributor = lot[distributor_id];
                        in_stock = distributor.inStock !== "False";
                        log_object.push({
                            is_future_lot: true,
                            lot_key,
                            distributor_id,
                            ...distributor
                        });
                        if (in_stock) {
                            break future_lot_loop;
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

async function send_discord_notification(url, body) {
    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
        .then((response) => response.text());
}

async function checker(loopState) {
    console.debug(`#> Starting stock check`);
    const is_in_stock = await get_stock_status(STOCK_CHECK_WEBSITE);
    console.debug(`#> Ended stock check: ${is_in_stock ? "IN_STOCK" : "OUT_OF_STOCK"}`);

    const has_changed_state = (loopState.is_in_stock !== is_in_stock);

    // Only notify discord + trigger the purchaser
    // if the console is in stock and we got a state change.
    // This prevents spam + keeps us from purchasing multiple times...
    if (is_in_stock && has_changed_state) {
        console.debug(`#> Sending discord notification`);
        try {
            const discord_response = await send_discord_notification(
                DISCORD_NOTIFICATION_URL,
                {
                    "content": "<@231454366236803085> 5 sec bot here - XBOX Series X IN STOCK at Microsoft Canada!",
                    "embeds": [
                        {
                            "author": {
                                "name": "Microsoft",
                                "icon_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/1200px-Xbox_one_logo.svg.png"
                            },
                            "title": "XBOX Series X",
                            "url": "https://www.xbox.com/en-ca/configure/8WJ714N3RBTL",
                            "description": "Go go go! You can [visit your cart](https://www.microsoft.com/en-ca/store/cart) or go to the [configure page](https://www.xbox.com/en-ca/configure/8WJ714N3RBTL) directly.",
                            "color": 6144542,
                            "image": {
                                "url": "https://compass-ssl.xbox.com/assets/b9/0a/b90ad58f-9950-44a7-87fa-1ee8f0b6a90e.jpg?n=XSX_Page-Hero-0_768x792.jpg"
                            }
                        }
                    ]
                }
            );
            console.debug(`#> Dicord response: `, discord_response);
        } catch (error) {
            console.error(`#> Error sending discord notification: ${error}`);
        }
        console.debug(`#> Sent discord notification`);
    }

    if (has_changed_state) {
        const today = new Date();
        const updated_at = today.toUTCString();

        loopState = { "console": CONSOLE, is_in_stock, updated_at, last_in_stock_at: loopState.last_in_stock_at || "" };
        if (is_in_stock) {
            loopState["last_in_stock_at"] = today.toUTCString();
        }

        console.debug(`#> Updated the database state`);
    }

    return loopState;
}

function convertTZ(date, tzString) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
}

function loop(
    interval,
    context,
    func
) {
    const stop = () => context.state = "PAUSED";
    const start = () => context.state = "RUNNING";

    setTimeout(() => {
        if (context.state === "RUNNING") {
            func({ data: context.data, start, stop });
        }

        loop(interval, context, func);
    }, interval);

    return { start, stop };
}

keepAlive();

loop(2000, { state: "RUNNING", data: { counter: 0, loopState: {} } },   async (options) => {
    const today = convertTZ(new Date(), 'America/New_York');
    console.log("")
    console.log(`#> Date: ${today.toDateString()}`)
    if (today.getDay() === 4) {
      const { data } = options;
      data.counter += 1;
      let newState = await checker({...data.loopState});
      data.loopState = {...data.loopState, ...newState};
    }
});