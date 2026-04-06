import { truncate_tables, close_pool } from "./test_helpers.ts";
import { create_new_user, create_user_context } from "../user.ts";

beforeEach(async () => {
  await truncate_tables();
});

afterAll(async () => {
  await close_pool();
});

describe("Creating Users & Fetching User Context", () => {
  it("creates a new user successfully", async () => {
    const new_user = await create_new_user("alice@example.com", "Alice");
    const user_id = new_user.user_id;
    const user_context = await create_user_context(user_id);
    expect(user_context).not.toBeNull();
    expect(user_context?.name).toBe("Alice");
    expect(user_context?.email).toBe("alice@example.com");
  });
  it("doesn't allow a user to be created with an invalid email", async () => {});
  it("doesn't allow a user to be created with an email that already exists", async () => {});
  it("returns null for non-existent user", async () => {
    const context = await create_user_context(9999);
    expect(context).toBeNull();
  });
  it("handles users without display names", async () => {});
});

describe("User Store Blacklisting", () => {
  it("allows a user to blacklist a store", async () => {});
  it("allows a user to unblacklist a store", async () => {});
  it("returns the correct list of blacklisted stores", async () => {});
  it("doesn't allow duplicate blacklisting of the same store", async () => {});
  it("handles unblacklisting of stores that aren't blacklisted", async () => {});
  it("handles blacklisting of non-existent stores", async () => {});
  it("handles unblacklisting of non-existent stores", async () => {});
});

describe("User Brand Blacklisting", () => {
  it("allows a user to blacklist a brand", async () => {});
  it("allows a user to unblacklist a brand", async () => {});
  it("returns the correct list of blacklisted brands", async () => {});
  it("doesn't allow duplicate blacklisting of the same brand", async () => {});
  it("handles unblacklisting of brands that aren't blacklisted", async () => {});
  it("handles blacklisting of non-existent brands", async () => {});
  it("handles unblacklisting of non-existent brands", async () => {});
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