import { Item } from "../types";

let state: Record<string, Item> = {};
export default {
    async getState(console: string) {
        const item = state[console] || {}
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
        return true;
    }
}