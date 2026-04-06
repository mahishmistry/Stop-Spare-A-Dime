import { truncate_tables, close_pool } from "./test_helpers.ts";
import { create_new_user, create_user_context } from "../user.ts";
import { pool } from "../pool.ts";

beforeEach(async () => {
  await truncate_tables();
});

afterAll(async () => {
  await close_pool();
});

/// Helper function to create a test user and return their context. Useful for testing store blacklisting and other user context features without having to repeat user creation code in every test.
async function _test_user_context() {
  await create_new_user("test@example.com", "Testificate");
  const user_context = await create_user_context(1);
  if (!user_context) {
    throw new Error("User context was not created");
  }
  return user_context;
}

async function _test_user_context_with_id() {
  const new_user = await create_new_user("test@example.com", "Testificate");
  const user_context = await create_user_context(new_user.user_id);
  if (!user_context) {
    throw new Error("User context was not created");
  }
  return {
    user_context,
    user_id: new_user.user_id,
  };
}

function _unique_suffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

async function _insert_test_product(product_name_prefix: string = "Product") {
  const product_name = `${product_name_prefix}_${_unique_suffix()}`;
  const req = await pool.query(
    "INSERT INTO products (name) VALUES ($1) RETURNING product_id",
    [product_name],
  );

  return {
    product_id: req.rows[0].product_id,
    product_name,
  };
}

async function _insert_test_deal() {
  const suffix = _unique_suffix();
  const store_source = `store_${suffix}`;

  await pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", [
    store_source,
    `https://${store_source}.com`,
  ]);

  const { product_id } = await _insert_test_product("DealProduct");

  const item_req = await pool.query(
    "INSERT INTO items (product_id, store_item_id, store_source) VALUES ($1, $2, $3) RETURNING item_id",
    [product_id, Math.floor(Math.random() * 1_000_000_000), store_source],
  );
  const item_id = item_req.rows[0].item_id;

  const deal_req = await pool.query(
    "INSERT INTO deals (item_id, original_price, on_sale, sale_price) VALUES ($1, $2, $3, $4) RETURNING deal_id",
    [item_id, 9.99, true, 7.49],
  );

  return {
    deal_id: deal_req.rows[0].deal_id,
    product_id,
    store_source,
  };
}

describe("Creating Users & Fetching User Context", () => {
  it("creates a new user successfully", async () => {
    const new_user = await create_new_user("alice@example.com", "Alice");
    const user_id = new_user.user_id;
    const user_context = await create_user_context(user_id);
    expect(user_context).not.toBeNull();
    expect(user_context?.name).toBe("Alice");
    expect(user_context?.email).toBe("alice@example.com");
  });

  it("Can fetch a user from their email", async () => {
    const new_user = await create_new_user("freddie@icarly.com", "Freddie");
    const user_id = new_user.user_id;
    const user_context = await create_user_context("freddie@icarly.com");
    expect(user_context).not.toBeNull();
    expect(user_context?.name).toBe("Freddie");
    expect(user_context?.email).toBe("freddie@icarly.com");
  });

  it("Doesn't try to fetch a user with an invalid email", async () => {
    await expect(create_user_context("invalid-email")).rejects.toThrow("invalid email format");
  });

  it("Returns null when trying to fetch a user with an email that doesn't exist", async () => {
    const user_context = await create_user_context("gaster@undertale.com");
    expect(user_context).toBeNull();
  });

  it("doesn't allow a user to be created with an invalid email", async () => {
      await expect(create_new_user("invalid-email", "Bob")).rejects.toThrow("invalid email format");
      await expect(create_new_user("another-invalid-email@", "Bob")).rejects.toThrow("invalid email format");
      await expect(create_new_user("@invalid-email.com", "Bob")).rejects.toThrow("invalid email format");
      await expect(create_new_user("invalid@email.", "Bob")).rejects.toThrow("invalid email format");
      await expect(create_new_user("invalid@.com", "Bob")).rejects.toThrow("invalid email format");
  });

  it("doesn't allow a user to be created with an email that already exists", async () => {
    const new_user = await create_new_user("charlie@smiling_friends.com", "Charlie");
    await expect(create_new_user("charlie@smiling_friends.com", "Charlie2")).rejects.toThrow("a user with this email already exists");
  });

  it("returns null for non-existent user", async () => {
    const context = await create_user_context(9999);
    expect(context).toBeNull();
  });

  it("handles users without display names", async () => {
    const new_user = await create_new_user("nameless@crazy.com", "");
    const user_id = new_user.user_id;
    const user_context = await create_user_context(user_id);
    expect(user_context?.name).toBe("User");
  });

});

describe("User Store Blacklisting", () => {

  it("allows a user to blacklist a store", async () => {
    const user_context = await _test_user_context();
    
    // INSERT STORE
    await pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["not_real_store", "notarealstore.com"]);

    await user_context.blacklist_store("not_real_store");
    const blacklisted_stores = await user_context.get_blacklisted_stores();
    expect(blacklisted_stores).not.toBeNull();
    expect(blacklisted_stores).toBeDefined();
    expect(blacklisted_stores.length).toBe(1);
    expect(blacklisted_stores[0]).toBe("not_real_store");
  });

  it("allows a user to blacklist then unblacklist a store", async () => {
    const user_context = await _test_user_context();
    
    // INSERT STORE
    await pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["not_real_store", "notarealstore.com"]);

    await user_context.blacklist_store("not_real_store");
    let blacklisted_stores = await user_context.get_blacklisted_stores();
    expect(blacklisted_stores.length).toBe(1);
    expect(blacklisted_stores[0]).toBe("not_real_store");

    await user_context.unblacklist_store("not_real_store");
    blacklisted_stores = await user_context.get_blacklisted_stores();
    expect(blacklisted_stores.length).toBe(0);
  });

  it("returns the correct list of blacklisted stores", async () => {
    const user_context = await _test_user_context();
    
    // INSERT STORES
    await Promise.all([
      pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["store_1", "store1.com"]),
      pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["store_2", "store2.com"]),
      pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["store_3", "store3.com"]),
    ]);

    await user_context.blacklist_store("store_1");
    let blacklisted_stores = await user_context.get_blacklisted_stores();
    expect(blacklisted_stores.length).toBe(1);
    expect(blacklisted_stores[0]).toBe("store_1");
    

    await user_context.blacklist_store("store_3");
    blacklisted_stores = await user_context.get_blacklisted_stores();
    expect(blacklisted_stores.length).toBe(2);
    expect(blacklisted_stores).toContain("store_1");
    expect(blacklisted_stores).toContain("store_3");
  });

  it("doesn't allow duplicate blacklisting of the same store", async () => {
      const user_context = await _test_user_context();

      // INSERT STORE
      await pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["not_real_store", "notarealstore.com"]);

      await user_context.blacklist_store("not_real_store");
      await user_context.blacklist_store("not_real_store");
      const blacklisted_stores = await user_context.get_blacklisted_stores();
      expect(blacklisted_stores.length).toBe(1);
      expect(blacklisted_stores[0]).toBe("not_real_store");
  });

  it("handles unblacklisting of stores that aren't blacklisted", async () => {
    const user_context = await _test_user_context();

    // INSERT STORE
      await pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["not_real_store", "notarealstore.com"]);

      await expect(user_context.unblacklist_store("not_real_store")).resolves.toBeFalsy();
  });

  it("handles blacklisting of non-existent stores", async () => {
    const user_context = await _test_user_context();
    await expect(user_context.blacklist_store("non_existent_store")).rejects.toThrow();
  });

  it("handles unblacklisting of non-existent stores", async () => {
    const user_context = await _test_user_context();
    await expect(user_context.unblacklist_store("non_existent_store")).resolves.toBeFalsy();
  });
});

describe("User Brand Blacklisting", () => {
  it("allows a user to blacklist a brand", async () => {
    const user_context = await _test_user_context();
    
    // INSERT BRAND
    await pool.query("INSERT INTO brands (name) VALUES ($1)", ["TestBrand"]);

    await user_context.blacklist_brand("TestBrand");
    const blacklisted_brands = await user_context.get_blacklisted_brands();
    expect(blacklisted_brands).not.toBeNull();
    expect(blacklisted_brands).toBeDefined();
    expect(blacklisted_brands.length).toBe(1);
    expect(blacklisted_brands[0]).toBe(1);
  });

  it("allows a user to blacklist then unblacklist a brand", async () => {
    const user_context = await _test_user_context();
    
    // INSERT BRAND
    await pool.query("INSERT INTO brands (name) VALUES ($1)", ["TestBrand"]);

    await user_context.blacklist_brand("TestBrand");
    let blacklisted_brands = await user_context.get_blacklisted_brands();
    expect(blacklisted_brands.length).toBe(1);
    expect(blacklisted_brands[0]).toBe(1);

    await user_context.unblacklist_brand("TestBrand");
    blacklisted_brands = await user_context.get_blacklisted_brands();
    expect(blacklisted_brands.length).toBe(0);
  });

  it("returns the correct list of blacklisted brands", async () => {
    const user_context = await _test_user_context();
    
    // INSERT BRANDS
    const brand1 = await pool.query("INSERT INTO brands (name) VALUES ($1) RETURNING brand_id", ["Brand1"]);
    const brand2 = await pool.query("INSERT INTO brands (name) VALUES ($1) RETURNING brand_id", ["Brand2"]);
    const brand3 = await pool.query("INSERT INTO brands (name) VALUES ($1) RETURNING brand_id", ["Brand3"]);

    await user_context.blacklist_brand("Brand1");
    let blacklisted_brands = await user_context.get_blacklisted_brands();
    expect(blacklisted_brands.length).toBe(1);
    expect(blacklisted_brands[0]).toBe(brand1.rows[0].brand_id);
    

    await user_context.blacklist_brand("Brand3");
    blacklisted_brands = await user_context.get_blacklisted_brands();
    expect(blacklisted_brands.length).toBe(2);
    expect(blacklisted_brands).toContain(brand1.rows[0].brand_id);
    expect(blacklisted_brands).toContain(brand3.rows[0].brand_id);
  });

  it("doesn't allow duplicate blacklisting of the same brand", async () => {
      const user_context = await _test_user_context();

      // INSERT BRAND
      await pool.query("INSERT INTO brands (name) VALUES ($1)", ["TestBrand"]);

      await user_context.blacklist_brand("TestBrand");
      await user_context.blacklist_brand("TestBrand");
      const blacklisted_brands = await user_context.get_blacklisted_brands();
      expect(blacklisted_brands.length).toBe(1);
      expect(blacklisted_brands[0]).toBe(1);
  });

  it("handles unblacklisting of brands that aren't blacklisted", async () => {
    const user_context = await _test_user_context();

    // INSERT BRAND
      await pool.query("INSERT INTO brands (name) VALUES ($1)", ["TestBrand"]);

      await expect(user_context.unblacklist_brand("TestBrand")).resolves.toBeFalsy();
  });

  it("handles blacklisting of non-existent brands", async () => {
    const user_context = await _test_user_context();
    await expect(user_context.blacklist_brand("non_existent_brand")).resolves.toBeFalsy();
  });

  it("handles unblacklisting of non-existent brands", async () => {
    const user_context = await _test_user_context();
    await expect(user_context.unblacklist_brand("non_existent_brand")).resolves.toBeFalsy();
  });
});

describe("Products", () => {
  it("Allows the user to save a product", async () => {
    const user_context = await _test_user_context();
    const { product_name, product_id } = await _insert_test_product("SavedProduct");

    await user_context.favorite_product(product_name);

    const saved_products = await user_context.get_favorite_products();
    expect(saved_products).not.toBeNull();
    expect(saved_products).toBeDefined();
    expect(saved_products.length).toBe(1);
    expect(saved_products[0]).toBe(product_id);
  });

  it("Allows the user to unsave a product", async () => {
    const user_context = await _test_user_context();
    const { product_name } = await _insert_test_product("UnsaveProduct");

    await user_context.favorite_product(product_name);
    let saved_products = await user_context.get_favorite_products();
    expect(saved_products.length).toBe(1);

    await user_context.unfavorite_product(product_name);
    saved_products = await user_context.get_favorite_products();
    expect(saved_products.length).toBe(0);
  });

  it("Returns the correct list of saved products", async () => {
    const user_context = await _test_user_context();
    const product_1 = await _insert_test_product("Product1");
    await _insert_test_product("Product2");
    const product_3 = await _insert_test_product("Product3");

    await user_context.favorite_product(product_1.product_name);
    let saved_products = await user_context.get_favorite_products();
    expect(saved_products.length).toBe(1);
    expect(saved_products[0]).toBe(product_1.product_id);

    await user_context.favorite_product(product_3.product_name);
    saved_products = await user_context.get_favorite_products();
    expect(saved_products.length).toBe(2);
    expect(saved_products).toContain(product_1.product_id);
    expect(saved_products).toContain(product_3.product_id);
  });

  it("Doesn't allow duplicate favoriting of the same product", async () => {
    const user_context = await _test_user_context();
    const { product_name, product_id } = await _insert_test_product("NoDuplicateProduct");

    await user_context.favorite_product(product_name);
    await user_context.favorite_product(product_name);

    const saved_products = await user_context.get_favorite_products();
    expect(saved_products.length).toBe(1);
    expect(saved_products[0]).toBe(product_id);
  });

  it("Handles unfavoriting of products that aren't saved", async () => {
    const user_context = await _test_user_context();
    const { product_name } = await _insert_test_product("UnsavedProduct");

    await expect(user_context.unfavorite_product(product_name)).resolves.toBeFalsy();
  });

  it("Handles favoriting of non-existent products", async () => {
    const user_context = await _test_user_context();
    await expect(user_context.favorite_product("non_existent_product")).resolves.toBeFalsy();
  });

  it("Handles unfavoriting of non-existent products", async () => {
    const user_context = await _test_user_context();
    await expect(user_context.unfavorite_product("non_existent_product")).resolves.toBeFalsy();
  });
});

describe("Deals", () => {
  it("Allows the user to save a deal", async () => {
    const user_context = await _test_user_context();
    const { deal_id } = await _insert_test_deal();

    await user_context.save_deal(deal_id);
    const saved_deals = await user_context.get_saved_deals();
    expect(saved_deals).not.toBeNull();
    expect(saved_deals).toBeDefined();
    expect(saved_deals.length).toBe(1);
    expect(saved_deals[0]).toBe(deal_id);
  });

  it("Allows the user to unsave a deal", async () => {
    const user_context = await _test_user_context();
    const { deal_id } = await _insert_test_deal();

    await user_context.save_deal(deal_id);
    let saved_deals = await user_context.get_saved_deals();
    expect(saved_deals.length).toBe(1);
    expect(saved_deals[0]).toBe(deal_id);

    await user_context.unsave_deal(deal_id);
    saved_deals = await user_context.get_saved_deals();
    expect(saved_deals.length).toBe(0);
  });

  it("Returns the correct list of saved deals", async () => {
    const user_context = await _test_user_context();
    const deal_1 = await _insert_test_deal();
    const deal_2 = await _insert_test_deal();
    const deal_3 = await _insert_test_deal();

    await user_context.save_deal(deal_1.deal_id);
    let saved_deals = await user_context.get_saved_deals();
    expect(saved_deals.length).toBe(1);
    expect(saved_deals[0]).toBe(deal_1.deal_id);

    await user_context.save_deal(deal_3.deal_id);
    saved_deals = await user_context.get_saved_deals();
    expect(saved_deals.length).toBe(2);
    expect(saved_deals).toContain(deal_1.deal_id);
    expect(saved_deals).toContain(deal_3.deal_id);

    await expect(user_context.save_deal(deal_2.deal_id)).resolves.toBeTruthy();
  });

  it("Doesn't allow duplicate favoriting of the same deal", async () => {
    const user_context = await _test_user_context();
    const { deal_id } = await _insert_test_deal();

    await user_context.save_deal(deal_id);
    await user_context.save_deal(deal_id);

    const saved_deals = await user_context.get_saved_deals();
    expect(saved_deals.length).toBe(1);
    expect(saved_deals[0]).toBe(deal_id);
  });

  it("Handles unfavoriting of deals that aren't saved", async () => {
    const user_context = await _test_user_context();
    const { deal_id } = await _insert_test_deal();

    await expect(user_context.unsave_deal(deal_id)).resolves.toBeFalsy();
  });

  it("Handles favoriting of non-existent deals", async () => {
    const user_context = await _test_user_context();
    await expect(user_context.save_deal(999999)).rejects.toThrow();
  });

  it("Handles unfavoriting of non-existent deals", async () => {
    const user_context = await _test_user_context();
    await expect(user_context.unsave_deal(999999)).resolves.toBeFalsy();
  });
});

describe("Memberships", () => {
  
  it("Allows the user to save a membership", async () => {
    const user_context = await _test_user_context();

    // INSERT STORE
    await pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["not_real_store", "notarealstore.com"]);
    
    await user_context.add_store_membership("not_real_store", "1234-1525-12591RSD");
    
    const saved_memberships = await user_context.get_memberships();
    expect(saved_memberships).not.toBeNull();
    expect(saved_memberships).toBeDefined();
    expect(saved_memberships.length).toBe(1);
    expect(saved_memberships[0]).toBe("not_real_store");
  });

  it("Allows the user to unsave a membership", async () => {
    const user_context = await _test_user_context();

    // INSERT STORE
    await pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["not_real_store", "notarealstore.com"]);
    
    await user_context.add_store_membership("not_real_store", "1234-1525-12591RSD");

    let saved_memberships = await user_context.get_memberships();
    expect(saved_memberships.length).toBe(1);
    expect(saved_memberships[0]).toBe("not_real_store");

    await user_context.remove_store_membership("not_real_store");
    saved_memberships = await user_context.get_memberships();
    expect(saved_memberships.length).toBe(0);
  });

  it("Returns the correct list of saved memberships", async () => {
    const user_context = await _test_user_context();

    // INSERT STORES
    await Promise.all([
      pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["store_1", "store1.com"]),
      pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["store_2", "store2.com"]),
      pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", ["store_3", "store3.com"]),
    ]);

    await user_context.add_store_membership("store_1", "1234-1525-12591RSD");
    let saved_memberships = await user_context.get_memberships();
    expect(saved_memberships.length).toBe(1);
    expect(saved_memberships[0]).toBe("store_1");

    await user_context.add_store_membership("store_3", "1234-1525-12591RSD");
    saved_memberships = await user_context.get_memberships();
    expect(saved_memberships.length).toBe(2);
    expect(saved_memberships).toContain("store_1");
    expect(saved_memberships).toContain("store_3");
  });

  it("Doesn't allow duplicate favoriting of the same membership", async () => {
    const user_context = await _test_user_context();

    await pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", [
      "not_real_store",
      "notarealstore.com",
    ]);

    await user_context.add_store_membership("not_real_store", "1234-1525-12591RSD");
    await user_context.add_store_membership("not_real_store", "1234-1525-12591RSD");

    const saved_memberships = await user_context.get_memberships();
    expect(saved_memberships.length).toBe(1);
    expect(saved_memberships[0]).toBe("not_real_store");
  });

  it("Handles unfavoriting of memberships that aren't saved", async () => {
    const user_context = await _test_user_context();

    await pool.query("INSERT INTO stores (store_source, url) VALUES ($1, $2)", [
      "not_real_store",
      "notarealstore.com",
    ]);

    await expect(user_context.remove_store_membership("not_real_store")).resolves.toBeFalsy();
  });

  it("Handles favoriting of non-existent memberships", async () => {
    const user_context = await _test_user_context();
    await expect(
      user_context.add_store_membership("non_existent_store", "1234-1525-12591RSD"),
    ).rejects.toThrow();
  });

  it("Handles unfavoriting of non-existent memberships", async () => {
    const user_context = await _test_user_context();
    await expect(user_context.remove_store_membership("non_existent_store")).resolves.toBeFalsy();
  });
});

describe("Search History", () => {
  it("Allows the user to save a search query", async () => {
    const user_context = await _test_user_context();

    await user_context.add_search_history("milk", new Date("2026-04-01T10:00:00.000Z"));

    const search_history = await user_context.get_search_history();
    expect(search_history).not.toBeNull();
    expect(search_history).toBeDefined();
    expect(search_history.length).toBe(1);
    expect(search_history[0]).toBe("milk");
  });

  it("Allows the user to delete a search query", async () => {
    const { user_context, user_id } = await _test_user_context_with_id();

    await user_context.add_search_history("milk", new Date("2026-04-01T10:00:00.000Z"));

    await pool.query(
      "DELETE FROM search_history WHERE user_id = $1 AND search_query = $2",
      [user_id, "milk"],
    );

    const search_history = await user_context.get_search_history();
    expect(search_history.length).toBe(0);
  });

  it("Returns the correct list of search history", async () => {
    const user_context = await _test_user_context();

    await user_context.add_search_history("oldest_query", new Date("2026-04-01T08:00:00.000Z"));
    await user_context.add_search_history("middle_query", new Date("2026-04-01T09:00:00.000Z"));
    await user_context.add_search_history("latest_query", new Date("2026-04-01T10:00:00.000Z"));

    const search_history = await user_context.get_search_history();
    expect(search_history.length).toBe(3);
    expect(search_history[0]).toBe("latest_query");
    expect(search_history[1]).toBe("middle_query");
    expect(search_history[2]).toBe("oldest_query");
  });

  it("Doesn't allow duplicate saving of the same search query", async () => {
    const user_context = await _test_user_context();

    await user_context.add_search_history("milk", new Date("2026-04-01T10:00:00.000Z"));
    await user_context.add_search_history("milk", new Date("2026-04-01T11:00:00.000Z"));

    const search_history = await user_context.get_search_history();
    const milk_entries = search_history.filter((query) => query === "milk");
    expect(milk_entries.length).toBe(1);
  });

  it("Handles deletion of search queries that aren't saved", async () => {
    const { user_id } = await _test_user_context_with_id();

    const delete_req = await pool.query(
      "DELETE FROM search_history WHERE user_id = $1 AND search_query = $2",
      [user_id, "query_that_does_not_exist"],
    );

    expect(delete_req.rowCount).toBe(0);
  });

  it("Handles saving of non-existent search queries", async () => {
    const user_context = await _test_user_context();
    await expect(
      user_context.add_search_history(null as unknown as string, new Date("2026-04-01T10:00:00.000Z")),
    ).rejects.toThrow();
  });

  it("Handles deletion of non-existent search queries", async () => {
    const { user_context, user_id } = await _test_user_context_with_id();

    await pool.query(
      "DELETE FROM search_history WHERE user_id = $1 AND search_query = $2",
      [user_id, "another_missing_query"],
    );

    const search_history = await user_context.get_search_history();
    expect(search_history.length).toBe(0);
  });
});

describe("User Settings", () => {
  it("Allows the user to update their display name", async () => {});
  it("Allows the user to update their email", async () => {});
  it("Doesn't allow the user to update their email to an invalid email", async () => {});
  it("Allows the user to update their notification preferences", async () => {});
});