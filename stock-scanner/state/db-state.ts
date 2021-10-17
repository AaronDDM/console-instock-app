import * as aws from "aws-sdk";
import config from "../config";
import { Item } from "../types";


const db = new aws.DynamoDB.DocumentClient({ region: config.AWS_REGION });

let state: Record<string, Item> = {};

export default {
    async getState(console: string) {
        const item = (await db.get({ TableName: config.TABLE_NAME, Key: { console } }).promise()).Item || {};
        if ("console" in item) {
            state[console] = item as Item;
            return state[console];
        }

        return null;
    },

    async updateState(console: string, is_in_stock: boolean) {
        const today = new Date();
        const updated_at = today.toUTCString();

        let Item: Item = { console, is_in_stock, updated_at, last_in_stock_at: state[console]?.last_in_stock_at || "" };
        if (is_in_stock) {
            Item["last_in_stock_at"] = today.toUTCString();
        }

        state[console] = Item;

        await db.put({ TableName: config.TABLE_NAME, Item }).promise();
        return true;
    }
}