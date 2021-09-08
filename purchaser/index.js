const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const AUTHORIZATION_MUID = process.env.AUTHORIZATION_MUID;
const ADD_CART_ITEMS = [
    {
        "productId": "8WJ714N3RB",
        "skuId": "490G",
        "availabilityId": "8WJ714N3RBTL",
        "quantity": 1,
        "optionalCampaignId": ""
    }
];

exports.lambdaHandler = async (event, context) => {
    console.debug(`#> Attempting to communicate with M$`);
    const headers = {
        "authority": "cart.production.store-web.dynamics.com",
        "pragma": "no-cache",
        "cache-control": "no-cache",
        "sec-ch-ua": "\"Google Chrome\";v=\"93\", \" Not;A Brand\";v=\"99\", \"Chromium\";v=\"93\"",
        "x-authorization-muid": AUTHORIZATION_MUID,
        "dnt": "1",
        "sec-ch-ua-mobile": "?0",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36",
        "content-type": "application/json",
        "accept": "*/*",
        "ms-cv": "zhtdTyVWjECkEPhI.8",
        "sec-ch-ua-platform": "\"macOS\"",
        "origin": "https://www.microsoft.com",
        "sec-fetch-site": "cross-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.microsoft.com/",
        "accept-language": "en-CA,en-US;q=0.9,en;q=0.8",
        "sec-gpc": "1"
    };

    const raw = JSON.stringify({
        "locale": "en-ca",
        "market": "CA",
        "catalogClientType": "storeWeb",
        "friendlyName": "cart-CA",
        "riskSessionId": "253cfae0-aa72-455e-be04-10fc1e03e2cb",
        "clientContext": {
            "client": "UniversalWebStore.Cart",
            "deviceFamily": null,
            "deviceType": "Pc"
        },
        "itemsToAdd": {
            "items": ADD_CART_ITEMS
        },
        "promoCodes": null
    });

    var requestOptions = {
        method: 'PUT',
        headers,
        body: raw,
        redirect: 'follow'
    };

    await fetch("https://cart.production.store-web.dynamics.com/cart/v1.0/cart/loadCart?cartType=consumer&appId=StoreWeb", requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));
    
    return true;
}