export { create_user_context };
async function _get_brand_id_from_name(client, brand_name) {
    const req = await client.query("SELECT brand_id FROM brands WHERE name = $1", [brand_name]);
    if (req.rowCount === 0) {
        return null; // No brand with the given name exists
    }
    return req.rows[0].brand_id;
}
;
async function _get_category_id_from_name(client, category_name) {
    const req = await client.query("SELECT category_id FROM categories WHERE name = $1", [category_name]);
    if (req.rowCount === 0) {
        return null; // No category with the given name exists
    }
    return req.rows[0].category_id;
}
async function _get_product_id_from_name(client, product_name) {
    const req = await client.query("SELECT product_id FROM products WHERE name = $1", [product_name]);
    if (req.rowCount === 0) {
        return null; // No product with the given name exists
    }
    return req.rows[0].product_id;
}
function _request_successful(req) {
    return req.rowCount !== null && req.rowCount > 0;
}
async function create_user_context(client, user_id) {
    if (!client) {
        throw new Error("Database client is required to create user context");
    }
    const req = await client.query("SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1) as user_exists", [user_id]);
    if (!req.rows[0].user_exists) {
        return null;
    }
    ; // If the user doesn't exist, return no context
    return user_context_object(client, user_id);
}
;
function user_context_object(client, user_id) {
    return {
        // Blacklisted Stores
        async blacklist_store(store_source) {
            const req = await client.query("INSERT INTO store_blacklists (user_id, store_source) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, store_source]);
            return _request_successful(req);
        },
        async unblacklist_store(store_source) {
            const req = await client.query("DELETE FROM store_blacklists WHERE user_id = $1 AND store_source = $2", [user_id, store_source]);
            return _request_successful(req);
        },
        async get_blacklisted_stores() {
            const req = await client.query("SELECT store_source FROM store_blacklists WHERE user_id = $1", [user_id]);
            return req.rows.map(row => row.store_source);
        },
        // Blacklisted Brands 
        async blacklist_brand(brand) {
            let brand_id;
            if (typeof brand === "number") {
                brand_id = brand;
            }
            else {
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
        async unblacklist_brand(brand) {
            let brand_id;
            if (typeof brand === "number") {
                brand_id = brand;
            }
            else {
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
        async get_blacklisted_brands() {
            const req = await client.query("SELECT brand_id FROM brand_blacklists WHERE user_id = $1", [user_id]);
            return req.rows.map(row => row.brand_id);
        },
        // Products
        async favorite_product(product) {
            let product_id;
            if (typeof product === "number") {
                product_id = product;
            }
            else {
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
        async unfavorite_product(product) {
            let product_id;
            if (typeof product === "number") {
                product_id = product;
            }
            else {
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
        async get_favorite_products(max = 10) {
            const req = await client.query("SELECT product_id FROM product_favorites WHERE user_id = $1 LIMIT $2", [user_id, max]);
            return req.rows.map(row => row.product_id);
        },
        // Deals
        async save_deal(deal_id) {
            const req = await client.query("INSERT INTO saved_deals (user_id, deal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user_id, deal_id]);
            return _request_successful(req);
        },
        async unsave_deal(deal_id) {
            const req = await client.query("DELETE FROM saved_deals WHERE user_id = $1 AND deal_id = $2", [user_id, deal_id]);
            return _request_successful(req);
        },
        async get_saved_deals(number_to_fetch = 10) {
            const req = await client.query("SELECT deal_id FROM saved_deals WHERE user_id = $1 LIMIT $2", [user_id, number_to_fetch]);
            return req.rows.map(row => row.deal_id);
        },
        // Memberships
        async add_store_membership(store_id, membership_id) {
            const req = await client.query("INSERT INTO store_memberships (user_id, store_id, membership_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [user_id, store_id, membership_id]);
            return _request_successful(req);
        },
        async remove_store_membership(store_id) { return false; },
        async get_memberships() { return Array(); },
        // Search History
        async add_search_history(search_query, datetime) {
            const req = await client.query("INSERT INTO search_history (user_id, search_query, datetime) VALUES ($1, $2, $3)", [user_id, search_query, datetime]);
            return _request_successful(req);
        },
        async get_search_history(past_n_searches = 10) {
            const req = await client.query("SELECT search_query FROM search_history WHERE user_id = $1 ORDER BY datetime DESC LIMIT $2", [user_id, past_n_searches]);
            return req.rows.map(row => row.search_query);
        },
    };
}
;
//# sourceMappingURL=user.js.map