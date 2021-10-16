export type Item = {
    console: string;
    is_in_stock: boolean;
    updated_at: string;
    last_in_stock_at: string;
}

export type CheckItem = {
    id: string;
    in_stock: boolean;
}