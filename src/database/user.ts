import { Client } from 'pg';
import { pool } from "./pool.ts";
import { get } from 'node:http';
export { create_new_user, create_user_context };

interface UserContext {
    name: string;
    email: string;
    send_notifications: boolean;
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
    add_store_membership(store_source: string, membership_id: string): Promise<boolean>;
    remove_store_membership(store_source: string): Promise<boolean>;
    get_memberships(): Promise<Array<string>>;
    add_search_history(search_query: string, datetime: Date): Promise<boolean>;
    get_search_history(past_n_searches?: number): Promise<Array<string>>;

    update_name(new_display_name: string): Promise<boolean>;
    update_email(new_email: string): Promise<boolean>;
    update_notifications(send_notifications: boolean): Promise<boolean>;
}

async function _get_brand_id_from_name(brand_name: string): Promise<number | null> {
    const req = await pool.query("SELECT brand_id FROM brands WHERE name = $1", [brand_name]);
    if (req.rowCount === 0) {
        return null; // No brand with the given name exists
    }
    return req.rows[0].brand_id;
};

async function _get_category_id_from_name(category_name: string): Promise<number | null> {
    const req = await pool.query("SELECT category_id FROM categories WHERE name = $1", [category_name]);
    if (req.rowCount === 0) {
        return null; // No category with the given name exists
    }
    return req.rows[0].category_id;
}

async function _get_product_id_from_name(product_name: string): Promise<number | null> {
    const req = await pool.query("SELECT product_id FROM products WHERE name = $1", [product_name]);
    if (req.rowCount === 0) {
        return null; // No product with the given name exists
    }
    return req.rows[0].product_id;
}

function _request_successful(req: any): boolean {
    return req.rowCount !== null && req.rowCount > 0;
}

function _is_valid_email(email: string): boolean {
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email_regex.test(email);
}

async function create_new_user(email: string, display_name: string): Promise<{user_id: number, email: string, name: string}> {
    if(!_is_valid_email(email)) {
        throw new Error("invalid email format");
    }

    const existing_user_check = await pool.query("SELECT user_id FROM users WHERE email = $1", [email]);
    if ((existing_user_check.rowCount ?? 0) > 0) {
        throw new Error("a user with this email already exists");
    }

    if (display_name.length === 0) {
        display_name = "User"; // Default display name if none provided
    }

    const result = await pool.query(
        `
        insert into public.users (email, name, send_notifications)
        values ($1, $2, false)
        returning *
        `,
        [email, display_name]
    );

    return result.rows[0];
};

async function create_user_context(user_info: number | string): Promise<UserContext | null> {
    let user_id: number;

    if (typeof user_info === "number") {
        user_id = user_info;
    } else {
        if (!_is_valid_email(user_info)) {
            throw new Error("invalid email format");
        }
        const req = await pool.query("SELECT user_id FROM users WHERE email = $1", [user_info]);
        if (req.rowCount === 0) {
            return null; // No user with the given email exists
        }
        user_id = req.rows[0].user_id;
    }

    if (!pool) {
        throw new Error("Database pool is required to create user context");
    }
    
    const req = await pool.query("SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1) as user_exists", [user_id]);
    
    console.log("User existence check result for user_id", user_id, ":", req.rows[0].user_exists);

    if (!req.rows[0].user_exists) {return null}; // If the user doesn't exist, return no context

    const name_req = await pool.query("SELECT name FROM users WHERE user_id = $1", [user_id]);
    const display_name = name_req.rows[0].name;

    const email_req = await pool.query("SELECT email FROM users WHERE user_id = $1", [user_id]);
    const email = email_req.rows[0].email;
    const notifs = email_req.rows[0].send_notifications || false;
    
    return _user_context_object(user_id, display_name, email, notifs);
};

function _user_context_object(user_id: number, display_name: string, user_email: string, notifications:boolean): UserContext {
    return {
    name: display_name,
    email: user_email,
    send_notifications: notifications,
    // Blacklisted Stores
    async blacklist_store(store_source: string): Promise<boolean> {
        const req = await pool.query("INSERT INTO store_blacklists (user_id, store_source) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, store_source]);
        return _request_successful(req);
    },
    async unblacklist_store(store_source: string): Promise<boolean> {
        const req = await pool.query("DELETE FROM store_blacklists WHERE user_id = $1 AND store_source = $2", [user_id, store_source]);
        return _request_successful(req);
    },
    async get_blacklisted_stores(): Promise<Array<string>> {
        const req = await pool.query("SELECT store_source FROM store_blacklists WHERE user_id = $1", [user_id]);
        return req.rows.map(row => row.store_source);
    },

    // Blacklisted Brands 
    async blacklist_brand(brand: number | string): Promise<boolean> {
        let brand_id: number;

        if (typeof brand === "number") {
            brand_id = brand;
        } else {
            console.log("Getting brand ID for brand name:", brand);
            const resolved_brand_id = await _get_brand_id_from_name(brand);

            if (resolved_brand_id === null) {
                return false; // No brand with the given name exists
            }

            console.log("Brand ID for brand name", brand, "is", resolved_brand_id);
            brand_id = resolved_brand_id;
        }

        const req = await pool.query("INSERT INTO brand_blacklists (user_id, brand_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, brand_id]);
        return _request_successful(req);
    },
    async unblacklist_brand(brand: number | string): Promise<boolean> {
        let brand_id: number;

        if (typeof brand === "number") {
            brand_id = brand;
        } else {
            console.log("Getting brand ID for brand name:", brand);
            const resolved_brand_id = await _get_brand_id_from_name(brand);

            if (resolved_brand_id === null) {
                return false; // No brand with the given name exists
            }

            console.log("Brand ID for brand name", brand, "is", resolved_brand_id);
            brand_id = resolved_brand_id;
        }

        const req = await pool.query("DELETE FROM brand_blacklists WHERE user_id = $1 AND brand_id = $2", [user_id, brand_id]);
        return _request_successful(req);
    },
    async get_blacklisted_brands(): Promise<Array<number>> {
        const req = await pool.query("SELECT brand_id FROM brand_blacklists WHERE user_id = $1", [user_id]);
        return req.rows.map(row => row.brand_id); 
    },
    
    // Products
    async favorite_product(product: number | string): Promise<boolean> {
        let product_id: number;

        if (typeof product === "number") {
            product_id = product;
        } else {
            console.log("Getting product ID for product name:", product);
            const resolved_product_id = await _get_product_id_from_name(product);

            if (resolved_product_id === null) {
                return false; // No product with the given name exists
            }
            
            console.log("Product ID for product name", product, "is", resolved_product_id);
            product_id = resolved_product_id;
        }

        const req = await pool.query("INSERT INTO favorite_products (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, product_id]);
        return _request_successful(req);
    },
    async unfavorite_product(product: number | string): Promise<boolean> {
        let product_id: number;
        if (typeof product === "number") {
            product_id = product;
        } else {
            const resolved_product_id = await _get_product_id_from_name(product);
            if (resolved_product_id === null) {
                return false; // No product with the given name exists
            }

            console.log("Product ID for product name", product, "is", resolved_product_id);
            product_id = resolved_product_id;
        }

        const req = await pool.query("DELETE FROM favorite_products WHERE user_id = $1 AND product_id = $2", [user_id, product_id]);
        return _request_successful(req);
    },
    async get_favorite_products(max: number = 10): Promise<Array<number>> {
        const req = await pool.query("SELECT product_id FROM favorite_products WHERE user_id = $1 LIMIT $2", [user_id, max]);
        return req.rows.map(row => row.product_id);
    },

    // Deals
    async save_deal(deal_id: number): Promise<boolean> {
        const req = await pool.query("INSERT INTO saved_deals (user_id, deal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, deal_id]);
        return _request_successful(req);
    },
    async unsave_deal(deal_id: number): Promise<boolean> {
        const req = await pool.query("DELETE FROM saved_deals WHERE user_id = $1 AND deal_id = $2", [user_id, deal_id]);
        return _request_successful(req);
    },
    async get_saved_deals(number_to_fetch: number = 10): Promise<Array<number>> {
        const req = await pool.query("SELECT deal_id FROM saved_deals WHERE user_id = $1 LIMIT $2", [user_id, number_to_fetch]);
        return req.rows.map(row => row.deal_id);
    },

    // Memberships
    async add_store_membership(store_source: string, membership_id: string): Promise<boolean> {
        const req = await pool.query("INSERT INTO store_memberships (user_id, store_source, membership_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, store_source) DO NOTHING", [user_id, store_source, membership_id]);
        return _request_successful(req);
    },
    async remove_store_membership(store_source: string): Promise<boolean> {
        const req = await pool.query("DELETE FROM store_memberships WHERE user_id = $1 AND store_source = $2", [user_id, store_source]);
        return _request_successful(req);
    },
    async get_memberships(): Promise<Array<string>> {
        const req = await pool.query("SELECT store_source FROM store_memberships WHERE user_id = $1", [user_id]);
        return req.rows.map(row => row.store_source);
    },

    // Search History
    async add_search_history(search_query: string, datetime:Date): Promise<boolean> {
        const req = await pool.query("INSERT INTO search_history (user_id, search_query, search_time) VALUES ($1, $2, $3)", [user_id, search_query, datetime]);
        return _request_successful(req);
    },
    async get_search_history(past_n_searches: number = 10): Promise<Array<string>> {
        const req = await pool.query("SELECT search_query FROM search_history WHERE user_id = $1 ORDER BY search_time DESC LIMIT $2", [user_id, past_n_searches]);
        return req.rows.map(row => row.search_query);
    },

    // User Settings
    async update_name(new_display_name: string): Promise<boolean> {
        const req = await pool.query("UPDATE users SET name = $1 WHERE user_id = $2", [new_display_name, user_id]);
        if (req !== null && req.rowCount != null && req.rowCount > 0) {
            this.name = new_display_name;
            return true;
        }
        return false;
    },

    async update_email(new_email: string): Promise<boolean> {
        if (!_is_valid_email(new_email)) {
            throw new Error("invalid email format");
        }
        const existing_user_check = await pool.query("SELECT user_id FROM users WHERE email = $1", [new_email]);
        if ((existing_user_check.rowCount ?? 0) > 0) {
            throw new Error("a user with this email already exists");
        }
        const req = await pool.query("UPDATE users SET email = $1 WHERE user_id = $2", [new_email, user_id]);
        if (req !== null && req.rowCount != null && req.rowCount > 0) {
            this.email = new_email;
            return true;
        }
        return false;
    },

    async update_notifications(send_notifs:boolean): Promise<boolean> {
        const req = await pool.query("UPDATE users SET send_notifications = $1 WHERE user_id = $2", [send_notifs, user_id]);
        this.send_notifications = send_notifs;
        return _request_successful(req);
    }
}};