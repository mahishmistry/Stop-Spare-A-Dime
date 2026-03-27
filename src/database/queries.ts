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
async function add_user(email: string, name?: string) {};

async function get_user_by_email(email: string) {};

/**
 * Saves a new store to the database.
 * @param source The source string of the store.
 * @param url The URL of the store's website.
 */
async function add_store(source: string, url: string,) {};

async function get_store_by_source(source: string) {};

/**
 * Adds a new location for a store to the database.
 * @param source The source string of the store. This should match the source string used when adding the store to the database.
 * @param address The address of the store location. This should be an object including the street, city, state, and zip_code of the location.
 */
async function add_store_location(source: string, address: Address) {};

/**
 * Adds a new brand to the database. A brand represents a specific company or manufacturer that produces products that can be sold at stores.
 * @param name 
 */
async function _add_brand(name: string) {};

/**
 * Adds a new category to the database. A category represents a specific type of product, such as "dairy" or "snacks", that can be used to group products together.
 * @param name
 */
async function _add_category(name: string) {};

/** Adds a new unit of measurement to the database. A unit represents a specific way of measuring the quantity of a product, such as "ounce" or "pound".
 * @param name 
 */
async function _add_unit(name: string) {};

/**
 * Adds a new product to the database. A product represents a specific type of item that can be sold at multiple stores, and includes information about the brand, category, unit of measurement, and whether the product is eligible for purchase with EBT benefits.
 * @param name 
 * @param brand_id 
 * @param category_id 
 * @param unit_id 
 * @param ebt_elligible 
 */
async function add_product(name: string, brand_id?: number, category_id?: number, unit_id?: number, ebt_elligible?:boolean) {};

async function get_product_by_id(product_id: number) {};
async function get_product_by_name(name: string) {};

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
async function add_item(product_id: number, store_id: number, store_item_id: number, avg_rating?: number, rating_count?: number, package_quantity?: number, unit_id?: number) {};

async function get_item_by_store_item_id(store_id: number, store_item_id: number) {};
async function get_item_by_id(item_id: number) {};
async function get_item_by_name(name: string) {};

/**
 * Adds a new deal to the database. A deal represents a specific price on an item at a specific store, and includes information about the original price, whether the item is currently on sale, the last time the deal was fetched from the store's website, the sale price (if the item is currently on sale), and whether the sale price is only available to members of the store's loyalty program.
 * @param item_id 
 * @param original_price 
 * @param on_sale 
 * @param last_fetched 
 * @param sale_price 
 * @param membership_sale 
 */
async function add_deal(item_id: number, original_price: number, on_sale: boolean, last_fetched:Date, sale_price?: number, membership_sale?: boolean) {};

async function get_deal_by_id(deal_id: number) {};