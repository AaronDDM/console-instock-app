import fetch from "node-fetch";
export default async function send_discord_notification(url: string, body: any) {
    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
    .then((response) => response.text());
}

