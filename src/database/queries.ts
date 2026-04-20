import * as dotenv from 'dotenv';
import { pool } from './pool.ts';
dotenv.config();

interface Address {
    street: string;
    city: string;
    state: string;
    zip_code: string;
}

function _is_valid_email(email: string): boolean {
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email_regex.test(email);
}

function _assert_valid_email(email: string): void {
    if (!_is_valid_email(email)) {
        throw new SyntaxError("BAD INPUT: invalid email format");
    }
}

function _assert_non_empty_string(value: string, field_name: string): void {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new SyntaxError(`BAD INPUT: ${field_name} must be a non-empty string`);
    }
}

function _assert_positive_integer(value: number, field_name: string): void {
    if (!Number.isInteger(value) || value <= 0) {
        throw new RangeError(`BAD INPUT: ${field_name} must be a positive integer`);
    }
}

function _assert_non_negative_number(value: number, field_name: string): void {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new RangeError(`BAD INPUT: ${field_name} must be a non-negative number`);
    }
}

function _assert_valid_url(url: string, field_name: string = "url"): void {
    try {
        new URL(url);
    } catch {
        throw new SyntaxError(`BAD INPUT: ${field_name} must be a valid URL`);
    }
}

function _assert_valid_date(value: Date, field_name: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        throw new RangeError(`BAD INPUT: ${field_name} must be a valid date`);
    }
}

/**
 * Inserts a user row into the users table.
 * @param email The user's email address.
 * @param name Optional display name for the user.
 * @returns A Promise that resolves to the inserted user object with user_id, email, name, and send_notifications.
 */
export async function add_user(email: string, name?: string) {
    _assert_valid_email(email);
    const result = await pool.query(
        `INSERT INTO users (email,name)
        VALUES ($1, $2)
        RETURNING *;`,
        [email,name ?? null]
    );
    return result.rows[0];
};

/**
 * Fetches a single user row by email.
 * @param email The email address to search for.
 * @returns A Promise that resolves to a user object with user_id, email, name, and send_notifications, or null.
 */
export async function get_user_by_email(email: string) {
    _assert_valid_email(email);
    const result = await pool.query(
        `SELECT * 
        FROM users
        WHERE email = $1;`,
        [email]
    );
    return result.rows[0] ?? null;
};

/**
 * Inserts a store row into the stores table.
 * @param source The store source identifier.
 * @param url The store URL.
 * @returns A Promise that resolves to the inserted store object with store_source, accepts_ebt, offers_delivery, and url.
 */
export async function add_store(source: string, url: string,) {
    _assert_non_empty_string(source, "source");
    _assert_non_empty_string(url, "url");
    _assert_valid_url(url);
    const result = await pool.query(
        `INSERT INTO stores(store_source,url)
         VALUES ($1, $2)
         RETURNING *;`,
         [source, url]
    );
    return result.rows[0];
};

/**
 * Fetches a single store row by source.
 * @param source The store source identifier.
 * @returns A Promise that resolves to a store object with store_source, accepts_ebt, offers_delivery, and url, or null.
 */
export async function get_store_by_source(source: string) {
    _assert_non_empty_string(source, "source");
    const result = await pool.query(
        `SELECT * 
        FROM stores
        WHERE store_source = $1;`,
        [source]
    );
    return result.rows[0] ?? null;
};

/**
 * Inserts a store address row for a store source.
 * @param source The store source identifier.
 * @param address The structured address object to store.
 * @returns A Promise that resolves to the inserted store address object with store_source and address.
 */
export async function add_store_location(source: string, address: Address) {
    _assert_non_empty_string(source, "source");
    _assert_non_empty_string(address.street, "address.street");
    _assert_non_empty_string(address.city, "address.city");
    _assert_non_empty_string(address.state, "address.state");
    _assert_non_empty_string(address.zip_code, "address.zip_code");
    const full_address = `${address.street}, ${address.city}, ${address.state}, ${address.zip_code}`;
    const result = await pool.query(
        `INSERT INTO store_addresses(store_source, address)
        VALUES ($1, $2)
        RETURNING *;`,
        [source, full_address]
    );
    return result.rows[0];
};

/**
 * Inserts a brand row into the brands table.
 * @param name The brand name.
 * @returns A Promise that resolves to the inserted brand object with brand_id and name.
 */
export async function _add_brand(name: string) {
    _assert_non_empty_string(name, "name");
    const result = await pool.query(
        `INSERT INTO brands (name)
        VALUES ($1)
        RETURNING *;`,
        [name]
    );
    return result.rows[0];
};

/**
 * Inserts a category row into the categories table.
 * @param name The category name.
 * @returns A Promise that resolves to the inserted category object with category_id and name.
 */
export async function _add_category(name: string) {
    _assert_non_empty_string(name, "name");
    const result = await pool.query(
        `INSERT INTO categories (name)
        VALUES($1)
        RETURNING *;`,
        [name]
    );
    return result.rows[0];
};

/**
 * Inserts a unit row into the units table.
 * @param name The unit name.
 * @param unit_type The unit type grouping.
 * @returns A Promise that resolves to the inserted unit object with unit_id, name, and unit_type.
 */
export async function _add_unit(name: string, unit_type: string) {
    _assert_non_empty_string(name, "name");
    _assert_non_empty_string(unit_type, "unit_type");
    const result = await pool.query(
        `INSERT INTO units (name, unit_type)
        VALUES ($1, $2)
        RETURNING *;`,
        [name, unit_type]
    );
    return result.rows[0];
};

/**
 * Inserts a product row into the products table.
 * @param name The product name.
 * @param brand_id Optional brand ID.
 * @param category_id Optional category ID.
 * @param unit_id Optional unit ID.
 * @param ebt_eligible Optional EBT eligibility flag.
 * @returns A Promise that resolves to the inserted product object with product_id, name, brand_id, category_id, unit_id, and ebt_eligible.
 */
export async function add_product(name: string, brand_id?: number, category_id?: number, unit_id?: number, ebt_eligible?:boolean) {
    _assert_non_empty_string(name, "name");
    if (brand_id != null) {
        _assert_positive_integer(brand_id, "brand_id");
    }
    if (category_id != null) {
        _assert_positive_integer(category_id, "category_id");
    }
    if (unit_id != null) {
        _assert_positive_integer(unit_id, "unit_id");
    }
    const result = await pool.query(
        `INSERT INTO products (name, brand_id, category_id, unit_id, ebt_eligible)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;`,
        [
            name,
            brand_id ?? null,
            category_id ?? null, 
            unit_id ?? null,
            ebt_eligible ?? false
        ]
    );
    return result.rows[0];
};

/**
 * Fetches a single product row by ID.
 * @param product_id The product ID.
 * @returns A Promise that resolves to a product object with product_id, name, brand_id, category_id, unit_id, and ebt_eligible, or null.
 */
export async function get_product_by_id(product_id: number) {
    _assert_positive_integer(product_id, "product_id");
    const result = await pool.query(
        `SELECT *
        FROM products
        WHERE product_id = $1;`,
        [product_id]
    );
    return result.rows[0] ?? null;
};

/**
 * Fetches product rows that match a product name.
 * @param name The product name.
 * @returns A Promise that resolves to an array of product objects, each with product_id, name, brand_id, category_id, unit_id, and ebt_eligible.
 */
export async function get_product_by_name(name: string) {
    _assert_non_empty_string(name, "name");
    const result = await pool.query(
        `SELECT *
        FROM products
        WHERE name = $1;`,
        [name]
    );
    return result.rows;
};

/**
 * Inserts an item row into the items table.
 * @param product_id The related product ID.
 * @param store_source The store source identifier.
 * @param store_item_id The store-specific item ID.
 * @param avg_rating Optional average rating value.
 * @param rating_count Optional number of ratings.
 * @param package_quantity Optional quantity per package.
 * @param unit_id Optional unit ID.
 * @returns A Promise that resolves to the inserted item object with item_id, product_id, store_item_id, avg_rating, rating_count, package_quantity, unit_id, and store_source.
 */
export async function add_item(product_id: number, store_source: string, store_item_id: number, avg_rating?: number, rating_count?: number, package_quantity?: number, unit_id?: number) {
    _assert_positive_integer(product_id, "product_id");
    _assert_non_empty_string(store_source, "store_source");
    _assert_positive_integer(store_item_id, "store_item_id");
    if (avg_rating != null) {
        _assert_non_negative_number(avg_rating, "avg_rating");
    }
    if (rating_count != null) {
        _assert_non_negative_number(rating_count, "rating_count");
    }
    if (package_quantity != null) {
        _assert_non_negative_number(package_quantity, "package_quantity");
    }
    if (unit_id != null) {
        _assert_positive_integer(unit_id, "unit_id");
    }
    const result = await pool.query(
        `INSERT INTO items
        (product_id, store_source, store_item_id, avg_rating, rating_count, package_quantity, unit_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;`,
        [product_id,
            store_source, 
            store_item_id, 
            avg_rating ?? null,
            rating_count ?? null,
            package_quantity ?? null,
            unit_id ?? null
        ]
    );
    return result.rows[0];
};

/**
 * Fetches a single item row by store source and store item ID.
 * @param store_source The store source identifier.
 * @param store_item_id The store-specific item ID.
 * @returns A Promise that resolves to an item object with item_id, product_id, store_item_id, avg_rating, rating_count, package_quantity, unit_id, and store_source, or null.
 */
export async function get_item_by_store_item_id(store_source: string, store_item_id: number) {
    _assert_non_empty_string(store_source, "store_source");
    _assert_positive_integer(store_item_id, "store_item_id");
    const result = await pool.query(
        `SELECT *
        FROM items
        WHERE store_source = $1 AND store_item_id = $2;`,
        [store_source, store_item_id]
    );
    return result.rows[0] ?? null; 
};

/**
 * Fetches a single item row by item ID.
 * @param item_id The item ID.
 * @returns A Promise that resolves to an item object with item_id, product_id, store_item_id, avg_rating, rating_count, package_quantity, unit_id, and store_source, or null.
 */
export async function get_item_by_id(item_id: number) {
    _assert_positive_integer(item_id, "item_id");
    const result = await pool.query(
        `SELECT *
        FROM items
        WHERE item_id = $1;`, 
        [item_id]
    );
    return result.rows[0] ?? null;
};

/**
 * Fetches item rows by product name.
 * @param name The product name.
 * @returns A Promise that resolves to an array of item objects, each with item_id, product_id, store_item_id, avg_rating, rating_count, package_quantity, unit_id, and store_source.
 */
export async function get_item_by_name(name: string) {
    _assert_non_empty_string(name, "name");
    const result = await pool.query(
        `SELECT items.*
        FROM items
        JOIN products ON items.product_id = products.product_id
        WHERE products.name = $1;`,
        [name]
    );
    return result.rows;
};

/**
 * Inserts a deal row into the deals table.
 * @param item_id The related item ID.
 * @param original_price The regular item price.
 * @param on_sale Whether the item is on sale.
 * @param last_fetched The timestamp when pricing was fetched.
 * @param sale_price Optional sale price.
 * @param membership_sale Optional membership-only sale flag.
 * @returns A Promise that resolves to the inserted deal object with deal_id, item_id, original_price, on_sale, sale_price, membership_sale, membership_price, and last_fetched.
 */
export async function add_deal(item_id: number, original_price: number, on_sale: boolean, last_fetched:Date, sale_price?: number, membership_sale?: boolean) {
    _assert_positive_integer(item_id, "item_id");
    _assert_non_negative_number(original_price, "original_price");
    _assert_valid_date(last_fetched, "last_fetched");
    if (sale_price != null) {
        _assert_non_negative_number(sale_price, "sale_price");
    }
    const result = await pool.query(
        `INSERT INTO deals
        (item_id, original_price, on_sale, last_fetched, sale_price, membership_sale)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;`,
        [
            item_id,
            original_price, 
            on_sale,
            last_fetched,
            sale_price ?? null, 
            membership_sale ?? false
        ]
    );
    return result.rows[0];
};

/**
 * Fetches a single deal row by deal ID.
 * @param deal_id The deal ID.
 * @returns A Promise that resolves to a deal object with deal_id, item_id, original_price, on_sale, sale_price, membership_sale, membership_price, and last_fetched, or null.
 */
export async function get_deal_by_id(deal_id: number) {
    _assert_positive_integer(deal_id, "deal_id");
    const result = await pool.query(
        `SELECT *
        FROM deals
        WHERE deal_id = $1;`, 
        [deal_id]
    );
    return result.rows[0] ?? null;
};