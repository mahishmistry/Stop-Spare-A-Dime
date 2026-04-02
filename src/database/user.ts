import { Client } from 'pg';
export { create_user_context };

interface UserContext {
    blacklist_store(store_source: string): Promise<boolean>;
    unblacklist_store(store_source: string): Promise<boolean>;
    get_blacklisted_stores(): Promise<Array<string>>;
    blacklist_brand(brand: number | string): Promise<boolean>;
    unblacklist_brand(brand: number | string): Promise<boolean>;
    get_blacklisted_brands(): Promise<Array<number>>;
    favorite_product(product: number | string): Promise<boolean>;
    unfavorite_product(product: number | string): Promise<boolean>;
    get_favorite_products(max?: number): Promise<Array<number>>;
    save_deal(deal_id: number): Promise<boolean>;
    unsave_deal(deal_id: number): Promise<boolean>;
    get_saved_deals(number_to_fetch?: number): Promise<Array<number>>;
    add_store_membership(store_id: number, membership_id: number): Promise<boolean>;
    remove_store_membership(store_id: number): Promise<boolean>;
    get_memberships(): Promise<Array<number>>;
    add_search_history(search_query: string, datetime: Date): Promise<boolean>;
    get_search_history(past_n_searches?: number): Promise<Array<string>>;
}

async function _get_brand_id_from_name(client: Client, brand_name: string): Promise<number | null> {
    const req = await client.query("SELECT brand_id FROM brands WHERE name = $1", [brand_name]);
    if (req.rowCount === 0) {
        return null; // No brand with the given name exists
    }
    return req.rows[0].brand_id;
};

async function _get_category_id_from_name(client: Client, category_name: string): Promise<number | null> {
    const req = await client.query("SELECT category_id FROM categories WHERE name = $1", [category_name]);
    if (req.rowCount === 0) {
        return null; // No category with the given name exists
    }
    return req.rows[0].category_id;
}

async function _get_product_id_from_name(client: Client, product_name: string): Promise<number | null> {
    const req = await client.query("SELECT product_id FROM products WHERE name = $1", [product_name]);
    if (req.rowCount === 0) {
        return null; // No product with the given name exists
    }
    return req.rows[0].product_id;
}

function _request_successful(req: any): boolean {
    return req.rowCount !== null && req.rowCount > 0;
}

async function create_user_context(client: Client, user_id: number): Promise<UserContext | null> {
    if (!client) {
        throw new Error("Database client is required to create user context");
    }
    const req = await client.query("SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1) as user_exists", [user_id]);

    if (!req.rows[0].user_exists) {return null}; // If the user doesn't exist, return no context
    
    return user_context_object(client, user_id);
};

function user_context_object(client:Client, user_id: number): UserContext {return {
    // Blacklisted Stores
    async blacklist_store(store_source: string): Promise<boolean> {
        const req = await client.query("INSERT INTO store_blacklists (user_id, store_source) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, store_source]);
        return _request_successful(req);
    },
    async unblacklist_store(store_source: string): Promise<boolean> {
        const req = await client.query("DELETE FROM store_blacklists WHERE user_id = $1 AND store_source = $2", [user_id, store_source]);
        return _request_successful(req);
    },
    async get_blacklisted_stores(): Promise<Array<string>> {
        const req = await client.query("SELECT store_source FROM store_blacklists WHERE user_id = $1", [user_id]);
        return req.rows.map(row => row.store_source);
    },

    // Blacklisted Brands 
    async blacklist_brand(brand: number | string): Promise<boolean> {
        let brand_id: number;

        if (typeof brand === "number") {
            brand_id = brand;
        } else {
            console.log("Getting brand ID for brand name:", brand);
            const resolved_brand_id = await _get_brand_id_from_name(client, brand);

            if (resolved_brand_id === null) {
                return false; // No brand with the given name exists
            }

            console.log("Brand ID for brand name", brand, "is", resolved_brand_id);
            brand_id = resolved_brand_id;
        }

        const req = await client.query("INSERT INTO brand_blacklists (user_id, brand_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, brand_id]);
        return _request_successful(req);
    },
    async unblacklist_brand(brand: number | string): Promise<boolean> {
        let brand_id: number;

        if (typeof brand === "number") {
            brand_id = brand;
        } else {
            console.log("Getting brand ID for brand name:", brand);
            const resolved_brand_id = await _get_brand_id_from_name(client, brand);

            if (resolved_brand_id === null) {
                return false; // No brand with the given name exists
            }

            console.log("Brand ID for brand name", brand, "is", resolved_brand_id);
            brand_id = resolved_brand_id;
        }

        const req = await client.query("DELETE FROM brand_blacklists WHERE user_id = $1 AND brand_id = $2", [user_id, brand_id]);
        return _request_successful(req);
    },
    async get_blacklisted_brands(): Promise<Array<number>> {
        const req = await client.query("SELECT brand_id FROM brand_blacklists WHERE user_id = $1", [user_id]);
        return req.rows.map(row => row.brand_id); 
    },
    
    // Products
    async favorite_product(product: number | string): Promise<boolean> {
        let product_id: number;

        if (typeof product === "number") {
            product_id = product;
        } else {
            console.log("Getting product ID for product name:", product);
            const resolved_product_id = await _get_product_id_from_name(client, product);

            if (resolved_product_id === null) {
                return false; // No product with the given name exists
            }
            
            console.log("Product ID for product name", product, "is", resolved_product_id);
            product_id = resolved_product_id;
        }

        const req = await client.query("INSERT INTO product_favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, product_id]);
        return _request_successful(req);
    },
    async unfavorite_product(product: number | string): Promise<boolean> {
        let product_id: number;
        if (typeof product === "number") {
            product_id = product;
        } else {
            const resolved_product_id = await _get_product_id_from_name(client, product);
            if (resolved_product_id === null) {
                return false; // No product with the given name exists
            }

            console.log("Product ID for product name", product, "is", resolved_product_id);
            product_id = resolved_product_id;
        }

        const req = await client.query("DELETE FROM product_favorites WHERE user_id = $1 AND product_id = $2", [user_id, product_id]);
        return _request_successful(req);
    },
    async get_favorite_products(max: number = 10): Promise<Array<number>> {
        const req = await client.query("SELECT product_id FROM product_favorites WHERE user_id = $1 LIMIT $2", [user_id, max]);
        return req.rows.map(row => row.product_id);
    },

    // Deals
    async save_deal(deal_id: number): Promise<boolean> {
        const req = await client.query("INSERT INTO saved_deals (user_id, deal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, deal_id]);
        return _request_successful(req);
    },
    async unsave_deal(deal_id: number): Promise<boolean> {
        const req = await client.query("DELETE FROM saved_deals WHERE user_id = $1 AND deal_id = $2", [user_id, deal_id]);
        return _request_successful(req);
    },
    async get_saved_deals(number_to_fetch: number = 10): Promise<Array<number>> {
        const req = await client.query("SELECT deal_id FROM saved_deals WHERE user_id = $1 LIMIT $2", [user_id, number_to_fetch]);
        return req.rows.map(row => row.deal_id);
    },

    // Memberships
    async add_store_membership(store_id: number, membership_id: number): Promise<boolean> {
        const req = await client.query("INSERT INTO store_memberships (user_id, store_id, membership_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [user_id, store_id, membership_id]);
        return _request_successful(req);
    },
    async remove_store_membership(store_id: number): Promise<boolean> {return false},
    async get_memberships(): Promise<Array<number>> {return Array()},

    // Search History
    async add_search_history(search_query: string, datetime:Date): Promise<boolean> {
        const req = await client.query("INSERT INTO search_history (user_id, search_query, datetime) VALUES ($1, $2, $3)", [user_id, search_query, datetime]);
        return _request_successful(req);
    },
    async get_search_history(past_n_searches: number = 10): Promise<Array<string>> {
        const req = await client.query("SELECT search_query FROM search_history WHERE user_id = $1 ORDER BY datetime DESC LIMIT $2", [user_id, past_n_searches]);
        return req.rows.map(row => row.search_query);
    },
}};