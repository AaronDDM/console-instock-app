const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const DISCORD_NOTIFICATION_URL = process.env.DISCORD_NOTIFICATION_URL || "https://discord.com/api/webhooks/884907776135008326/SzZY7S4axSxi7AeNaREGtpn_ozRrCuSAxNOvTQWeOLDhaz8M9fsy3MvJEW3eiH-L9blz";

async function send_discord_notification(url, body) {
    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
        .then((response) => response.text());
}

exports.lambdaHandler = async (event, context) => {
    console.debug(`#> Startingnotification`);
    const author_name = "author_name" in event ? event.author_name : "Unknown Author";
    const icon_url = "icon_url" in event ? event.icon_url : "";
    const title = "title" in event ? event.title : "Unknown Title";
    const url = "url" in event ? event.url : "";

    try {
        const discord_response = await send_discord_notification(
            DISCORD_NOTIFICATION_URL,
            {
                "content": "<@318422857795371008> <@231454366236803085> XBOX Series X IN STOCK at Microsoft Canada!",
                "embeds": [
                    {
                        "author": {
                            "name": author_name,
                            "icon_url": icon_url
                        },
                        "title": title,
                        "url": url,
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

    console.debug(`#> Ended notification`)
}