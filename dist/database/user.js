import { pool } from "./pool.js";
export { create_new_user, create_user_context };
async function _get_brand_id_from_name(brand_name) {
    const req = await pool.query("SELECT brand_id FROM brands WHERE name = $1", [brand_name]);
    if (req.rowCount === 0) {
        return null; // No brand with the given name exists
    }
    return req.rows[0].brand_id;
}
;
async function _get_category_id_from_name(category_name) {
    const req = await pool.query("SELECT category_id FROM categories WHERE name = $1", [category_name]);
    if (req.rowCount === 0) {
        return null; // No category with the given name exists
    }
    return req.rows[0].category_id;
}
async function _get_product_id_from_name(product_name) {
    const req = await pool.query("SELECT product_id FROM products WHERE name = $1", [product_name]);
    if (req.rowCount === 0) {
        return null; // No product with the given name exists
    }
    return req.rows[0].product_id;
}
function _request_successful(req) {
    return req.rowCount !== null && req.rowCount > 0;
}
function _is_valid_email(email) {
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email_regex.test(email);
}
async function create_new_user(email, display_name) {
    if (!_is_valid_email(email)) {
        throw new SyntaxError("BAD INPUT: invalid email format");
    }
    const existing_user_check = await pool.query("SELECT user_id FROM users WHERE email = $1", [email]);
    if ((existing_user_check.rowCount ?? 0) > 0) {
        throw new Error("ALREADY EXISTS: user with this email already exists");
    }
    if (display_name.length === 0) {
        display_name = "User"; // Default display name if none provided
    }
    const result = await pool.query(`
        insert into public.users (email, name, send_notifications)
        values ($1, $2, false)
        returning *
        `, [email, display_name]);
    return result.rows[0];
}
;
/**
 * Builds a user context object for a user ID or email.
 * @param user_info The user ID or email to resolve.
 * @returns A Promise that resolves to a UserContext object or null if no user exists.
 */
async function create_user_context(user_info) {
    let user_id;
    if (typeof user_info === "number") {
        user_id = user_info;
    }
    else {
        if (!_is_valid_email(user_info)) {
            throw new SyntaxError("BAD INPUT: invalid email format");
        }
        const req = await pool.query("SELECT user_id FROM users WHERE email = $1", [user_info]);
        if (req.rowCount === 0) {
            return null; // No user with the given email exists
        }
        user_id = req.rows[0].user_id;
    }
    if (!pool) {
        throw new Error("NO POOL: database connection pool is required to create user context");
    }
    const req = await pool.query("SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1) as user_exists", [user_id]);
    console.log("User existence check result for user_id", user_id, ":", req.rows[0].user_exists);
    if (!req.rows[0].user_exists) {
        return null;
    }
    ; // If the user doesn't exist, return no context
    const name_req = await pool.query("SELECT name FROM users WHERE user_id = $1", [user_id]);
    const display_name = name_req.rows[0].name;
    const email_req = await pool.query("SELECT email FROM users WHERE user_id = $1", [user_id]);
    const email = email_req.rows[0].email;
    const notifs = email_req.rows[0].send_notifications || false;
    return _user_context_object(user_id, display_name, email, notifs);
}
;
/**
 * Creates a UserContext object with methods scoped to one user.
 * @param user_id The internal user ID.
 * @param display_name The initial display name for the context.
 * @param user_email The initial email for the context.
 * @param notifications The initial notifications setting for the context.
 * @returns A UserContext object with database-backed user methods.
 */
function _user_context_object(user_id, display_name, user_email, notifications) {
    return {
        name: display_name,
        email: user_email,
        send_notifications: notifications,
        // Blacklisted Stores
        /**
         * Adds a store to the user's blacklist.
         * @param store_source The store source identifier.
         * @returns A Promise that resolves to true when a row is inserted.
         */
        async blacklist_store(store_source) {
            const req = await pool.query("INSERT INTO store_blacklists (user_id, store_source) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, store_source]);
            return _request_successful(req);
        },
        /**
         * Removes a store from the user's blacklist.
         * @param store_source The store source identifier.
         * @returns A Promise that resolves to true when a row is deleted.
         */
        async unblacklist_store(store_source) {
            const req = await pool.query("DELETE FROM store_blacklists WHERE user_id = $1 AND store_source = $2", [user_id, store_source]);
            return _request_successful(req);
        },
        /**
         * Gets all store sources blacklisted by the user.
         * @returns A Promise that resolves to an array of blacklisted store source strings.
         */
        async get_blacklisted_stores() {
            const req = await pool.query("SELECT store_source FROM store_blacklists WHERE user_id = $1", [user_id]);
            return req.rows.map(row => row.store_source);
        },
        // Blacklisted Brands 
        /**
         * Adds a brand to the user's blacklist.
         * @param brand The brand ID or brand name.
         * @returns A Promise that resolves to true when a row is inserted.
         */
        async blacklist_brand(brand) {
            let brand_id;
            if (typeof brand === "number") {
                brand_id = brand;
            }
            else {
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
        /**
         * Removes a brand from the user's blacklist.
         * @param brand The brand ID or brand name.
         * @returns A Promise that resolves to true when a row is deleted.
         */
        async unblacklist_brand(brand) {
            let brand_id;
            if (typeof brand === "number") {
                brand_id = brand;
            }
            else {
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
        /**
         * Gets all blacklisted brand IDs for the user.
         * @returns A Promise that resolves to an array of brand ID numbers.
         */
        async get_blacklisted_brands() {
            const req = await pool.query("SELECT brand_id FROM brand_blacklists WHERE user_id = $1", [user_id]);
            return req.rows.map(row => row.brand_id);
        },
        // Products
        /**
         * Marks a product as a favorite for the user.
         * @param product The product ID or product name.
         * @returns A Promise that resolves to true when a row is inserted.
         */
        async favorite_product(product) {
            let product_id;
            if (typeof product === "number") {
                product_id = product;
            }
            else {
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
        /**
         * Removes a product from the user's favorites.
         * @param product The product ID or product name.
         * @returns A Promise that resolves to true when a row is deleted.
         */
        async unfavorite_product(product) {
            let product_id;
            if (typeof product === "number") {
                product_id = product;
            }
            else {
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
        /**
         * Gets favorite product IDs for the user.
         * @param max The maximum number of favorites to return.
         * @returns A Promise that resolves to an array of product ID numbers.
         */
        async get_favorite_products(max = 10) {
            const req = await pool.query("SELECT product_id FROM favorite_products WHERE user_id = $1 LIMIT $2", [user_id, max]);
            return req.rows.map(row => row.product_id);
        },
        // Deals
        /**
         * Saves a deal for the user.
         * @param deal_id The deal ID to save.
         * @returns A Promise that resolves to true when a row is inserted.
         */
        async save_deal(deal_id) {
            const req = await pool.query("INSERT INTO saved_deals (user_id, deal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, deal_id]);
            return _request_successful(req);
        },
        /**
         * Removes a saved deal for the user.
         * @param deal_id The deal ID to remove.
         * @returns A Promise that resolves to true when a row is deleted.
         */
        async unsave_deal(deal_id) {
            const req = await pool.query("DELETE FROM saved_deals WHERE user_id = $1 AND deal_id = $2", [user_id, deal_id]);
            return _request_successful(req);
        },
        /**
         * Gets saved deal IDs for the user.
         * @param number_to_fetch The maximum number of saved deals to return.
         * @returns A Promise that resolves to an array of deal ID numbers.
         */
        async get_saved_deals(number_to_fetch = 10) {
            const req = await pool.query("SELECT deal_id FROM saved_deals WHERE user_id = $1 LIMIT $2", [user_id, number_to_fetch]);
            return req.rows.map(row => row.deal_id);
        },
        // Memberships
        /**
         * Adds a store membership for the user.
         * @param store_source The store source identifier.
         * @param membership_id The membership ID for that store.
         * @returns A Promise that resolves to true when a row is inserted.
         */
        async add_store_membership(store_source, membership_id) {
            const req = await pool.query("INSERT INTO store_memberships (user_id, store_source, membership_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, store_source) DO NOTHING", [user_id, store_source, membership_id]);
            return _request_successful(req);
        },
        /**
         * Removes a store membership for the user.
         * @param store_source The store source identifier.
         * @returns A Promise that resolves to true when a row is deleted.
         */
        async remove_store_membership(store_source) {
            const req = await pool.query("DELETE FROM store_memberships WHERE user_id = $1 AND store_source = $2", [user_id, store_source]);
            return _request_successful(req);
        },
        /**
         * Gets store sources where the user has memberships.
         * @returns A Promise that resolves to an array of store source strings.
         */
        async get_memberships() {
            const req = await pool.query("SELECT store_source FROM store_memberships WHERE user_id = $1", [user_id]);
            return req.rows.map(row => row.store_source);
        },
        // Search History
        /**
         * Adds a search history record for the user.
         * @param search_query The search query text.
         * @param datetime The timestamp for the search.
         * @returns A Promise that resolves to true when a row is inserted.
         */
        async add_search_history(search_query, datetime) {
            const req = await pool.query("INSERT INTO search_history (user_id, search_query, search_time) VALUES ($1, $2, $3)", [user_id, search_query, datetime]);
            return _request_successful(req);
        },
        /**
         * Gets recent search queries for the user.
         * @param past_n_searches The maximum number of recent searches to return.
         * @returns A Promise that resolves to an array of search query strings.
         */
        async get_search_history(past_n_searches = 10) {
            const req = await pool.query("SELECT search_query FROM search_history WHERE user_id = $1 ORDER BY search_time DESC LIMIT $2", [user_id, past_n_searches]);
            return req.rows.map(row => row.search_query);
        },
        // User Settings
        /**
         * Updates the user's display name.
         * @param new_display_name The new display name.
         * @returns A Promise that resolves to true when the user row is updated.
         */
        async update_name(new_display_name) {
            const req = await pool.query("UPDATE users SET name = $1 WHERE user_id = $2", [new_display_name, user_id]);
            if (req !== null && req.rowCount != null && req.rowCount > 0) {
                this.name = new_display_name;
                return true;
            }
            return false;
        },
        /**
         * Updates the user's email.
         * @param new_email The new email address.
         * @returns A Promise that resolves to true when the user row is updated.
         */
        async update_email(new_email) {
            if (!_is_valid_email(new_email)) {
                throw new SyntaxError("BAD INPUT: invalid email format");
            }
            const existing_user_check = await pool.query("SELECT user_id FROM users WHERE email = $1", [new_email]);
            if ((existing_user_check.rowCount ?? 0) > 0) {
                throw new Error("ALREADY EXISTS: user with this email already exists");
            }
            const req = await pool.query("UPDATE users SET email = $1 WHERE user_id = $2", [new_email, user_id]);
            if (req !== null && req.rowCount != null && req.rowCount > 0) {
                this.email = new_email;
                return true;
            }
            return false;
        },
        /**
         * Updates whether notifications are enabled for the user.
         * @param send_notifs Whether notifications should be enabled.
         * @returns A Promise that resolves to true when the user row is updated.
         */
        async update_notifications(send_notifs) {
            const req = await pool.query("UPDATE users SET send_notifications = $1 WHERE user_id = $2", [send_notifs, user_id]);
            this.send_notifications = send_notifs;
            return _request_successful(req);
        }
    };
}
;
//# sourceMappingURL=user.js.map