const DEBUG = process.env.DEBUG || false;
const DISCORD_NOTIFICATION_URL = process.env.DISCORD_NOTIFICATION_URL || "";
const DISCORD_BOT_STATUS_CHECK_URL = process.env.DISCORD_BOT_STATUS_CHECK_URL || "";
const TABLE_NAME = process.env.TABLE_NAME || "buy-bot-state-table";
const AWS_REGION = process.env.AWS_REGION || "ca-central-1";
const CONSOLES = {
    "8WJ714N3RBTL/490G/8W0DZS99WPZZ": {
        name: "XBOX Series X",
        url: "https://www.xbox.com/en-ca/configure/8WJ714N3RBTL",
        description: "Go go go! You can [visit your cart](https://www.microsoft.com/en-ca/store/cart) or go to the [configure page](https://www.xbox.com/en-ca/configure/8WJ714N3RBTL) directly.",
        image_url: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4mRni?ver=8361&q=90&o=f&w=400&h=400",
        color: 6144542,
        author: {
            "name": "Microsoft",
            "icon_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/1200px-Xbox_one_logo.svg.png"
        },
    },
    "8RPM8T9CK0P6/GSTK/8WTZMJQ0DKPM": {
        name: "Xbox Series X – Halo Infinite Limited Edition Bundle",
        url: "https://www.xbox.com/en-ca/configure/8RPM8T9CK0P6",
        description: "Go go go! You can [visit your cart](https://www.microsoft.com/en-ca/store/cart) or go to the [configure page](https://www.xbox.com/en-ca/configure/8RPM8T9CK0P6) directly.",
        image_url: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWJbVk?ver=9a01&q=90&o=f&w=400&h=400",
        color: 12164199,
        author: {
            "name": "Microsoft",
            "icon_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/1200px-Xbox_one_logo.svg.png"
        },
    }
}

const config = {
    DEBUG,
    DISCORD_NOTIFICATION_URL,
    DISCORD_BOT_STATUS_CHECK_URL,
    TABLE_NAME,
    AWS_REGION,
    CONSOLES
}

for (const value of Object.keys(config)) {
    if (typeof config[value as keyof typeof config] === "string" && config[value as keyof typeof config].toString().length === 0) {
        throw Error(`Invalid config for ${value}.`);
    }
}

export default config;