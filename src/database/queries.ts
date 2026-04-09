import * as dotenv from 'dotenv';
import { pool } from './pool.ts';
dotenv.config();

interface Address {
    street: string;
    city: string;
    state: string;
    zip_code: string;
}

/**
 * Saves a user to the database.
 * @param email The user's email address. This should be unique across all users in the database and should be validated by the caller before being passed to this function.
 * @param name The user's name. This is an optional field and can be null if the user does not wish to provide it.
 */
export async function add_user(email: string, name?: string) {
    const result = await pool.query(
        `INSERT INTO users (email,name)
        VALUES ($1, $2)
        RETURNING *;`,
        [email,name ?? null]
    );
    return result.rows[0];
};

export async function get_user_by_email(email: string) {
    const result = await pool.query(
        `SELECT * 
        FROM users
        WHERE email = $1;`,
        [email]
    );
    return result.rows[0] ?? null;
};

/**
 * Saves a new store to the database.
 * @param source The source string of the store.
 * @param url The URL of the store's website.
 */
export async function add_store(source: string, url: string,) {
    const result = await pool.query(
        `INSERT INTO stores(store_source,url)
         VALUES ($1, $2)
         RETURNING *;`,
         [source, url]
    );
    return result.rows[0];
};

export async function get_store_by_source(source: string) {
    const result = await pool.query(
        `SELECT * 
        FROM stores
        WHERE store_source = $1;`,
        [source]
    );
    return result.rows[0] ?? null;
};

/**
 * Adds a new location for a store to the database.
 * @param source The source string of the store. This should match the source string used when adding the store to the database.
 * @param address The address of the store location. This should be an object including the street, city, state, and zip_code of the location.
 */
export async function add_store_location(source: string, address: Address) {
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
 * Adds a new brand to the database. A brand represents a specific company or manufacturer that produces products that can be sold at stores.
 * @param name 
 */
export async function _add_brand(name: string) {
    const result = await pool.query(
        `INSERT INTO brands (name)
        VALUES ($1)
        RETURNING *;`,
        [name]
    );
    return result.rows[0];
};

/**
 * Adds a new category to the database. A category represents a specific type of product, such as "dairy" or "snacks", that can be used to group products together.
 * @param name
 */
export async function _add_category(name: string) {
    const result = await pool.query(
        `INSERT INTO categories (name)
        VALUES($1)
        RETURNING *;`,
        [name]
    );
    return result.rows[0];
};

/** Adds a new unit of measurement to the database. A unit represents a specific way of measuring the quantity of a product, such as "ounce" or "pound".
 * @param name 
 */
export async function _add_unit(name: string, unit_type: string) {
    const result = await pool.query(
        `INSERT INTO units (name, unit_type)
        VALUES ($1, $2)
        RETURNING *;`,
        [name, unit_type]
    );
    return result.rows[0];
};

/**
 * Adds a new product to the database. A product represents a specific type of item that can be sold at multiple stores, and includes information about the brand, category, unit of measurement, and whether the product is eligible for purchase with EBT benefits.
 * @param name 
 * @param brand_id 
 * @param category_id 
 * @param unit_id 
 * @param ebt_elligible 
 */
export async function add_product(name: string, brand_id?: number, category_id?: number, unit_id?: number, ebt_eligible?:boolean) {
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

export async function get_product_by_id(product_id: number) {
    const result = await pool.query(
        `SELECT *
        FROM products
        WHERE product_id = $1;`,
        [product_id]
    );
    return result.rows[0] ?? null;
};
export async function get_product_by_name(name: string) {
    const result = await pool.query(
        `SELECT *
        FROM products
        WHERE name = $1;`,
        [name]
    );
    return result.rows;
};

/**
 * Adds a new item to the database. An item represents a specific product being sold at a specific store, and includes information about the average rating of the product at that store, the number of ratings, the quantity in a package, and the unit of measurement for the product.
 * @param product_id 
 * @param store_id 
 * @param store_item_id 
 * @param avg_rating 
 * @param rating_count 
 * @param package_quantity 
 * @param unit_id 
 */
export async function add_item(product_id: number, store_source: string, store_item_id: number, avg_rating?: number, rating_count?: number, package_quantity?: number, unit_id?: number) {
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

export async function get_item_by_store_item_id(store_source: string, store_item_id: number) {
    const result = await pool.query(
        `SELECT *
        FROM items
        WHERE store_source = $1 AND store_item_id = $2;`,
        [store_source, store_item_id]
    );
    return result.rows[0] ?? null; 
};
export async function get_item_by_id(item_id: number) {
    const result = await pool.query(
        `SELECT *
        FROM items
        WHERE item_id = $1;`, 
        [item_id]
    );
    return result.rows[0] ?? null;
};
export async function get_item_by_name(name: string) {
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
 * Adds a new deal to the database. A deal represents a specific price on an item at a specific store, and includes information about the original price, whether the item is currently on sale, the last time the deal was fetched from the store's website, the sale price (if the item is currently on sale), and whether the sale price is only available to members of the store's loyalty program.
 * @param item_id 
 * @param original_price 
 * @param on_sale 
 * @param last_fetched 
 * @param sale_price 
 * @param membership_sale 
 */
export async function add_deal(item_id: number, original_price: number, on_sale: boolean, last_fetched:Date, sale_price?: number, membership_sale?: boolean) {
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

export async function get_deal_by_id(deal_id: number) {
    const result = await pool.query(
        `SELECT *
        FROM deals
        WHERE deal_id = $1;`, 
        [deal_id]
    );
    return result.rows[0] ?? null;
};