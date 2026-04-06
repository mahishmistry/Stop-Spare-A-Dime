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
  it("Allows the user to save a product", async () => {});
  it("Allows the user to unsave a product", async () => {});
  it("Returns the correct list of saved products", async () => {});
  it("Doesn't allow duplicate favoriting of the same product", async () => {});
  it("Handles unfavoriting of products that aren't saved", async () => {});
  it("Handles favoriting of non-existent products", async () => {});
  it("Handles unfavoriting of non-existent products", async () => {});
});

describe("Deals", () => {
  it("Allows the user to save a deal", async () => {});
  it("Allows the user to unsave a deal", async () => {});
  it("Returns the correct list of saved deals", async () => {});
  it("Doesn't allow duplicate favoriting of the same deal", async () => {});
  it("Handles unfavoriting of deals that aren't saved", async () => {});
  it("Handles favoriting of non-existent deals", async () => {});
  it("Handles unfavoriting of non-existent deals", async () => {});
});

describe("Memberships", () => {
  it("Allows the user to save a membership", async () => {});
  it("Allows the user to unsave a membership", async () => {});
  it("Returns the correct list of saved memberships", async () => {});
  it("Doesn't allow duplicate favoriting of the same membership", async () => {});
  it("Handles unfavoriting of memberships that aren't saved", async () => {});
  it("Handles favoriting of non-existent memberships", async () => {});
  it("Handles unfavoriting of non-existent memberships", async () => {});
});

describe("Search History", () => {
  it("Allows the user to save a search query", async () => {});
  it("Allows the user to delete a search query", async () => {});
  it("Returns the correct list of search history", async () => {});
  it("Doesn't allow duplicate saving of the same search query", async () => {});
  it("Handles deletion of search queries that aren't saved", async () => {});
  it("Handles saving of non-existent search queries", async () => {});
  it("Handles deletion of non-existent search queries", async () => {});
});

describe("User Settings", () => {
  it("Allows the user to update their display name", async () => {});
  it("Allows the user to update their email", async () => {});
  it("Doesn't allow the user to update their email to an invalid email", async () => {});
  it("Allows the user to update their notification preferences", async () => {});
});