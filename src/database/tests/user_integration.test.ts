import { truncate_tables, close_pool } from "./test_helpers.ts";
import { create_new_user, create_user_context } from "../user.ts";

beforeEach(async () => {
  await truncate_tables();
});

afterAll(async () => {
  await close_pool();
});

describe("create_new_user", () => {
  it("creates a new user successfully", async () => {
    const request = await create_new_user("alice@example.com", "Alice");
    const user_id = request.user_id;
    const context = await create_user_context(user_id);
    expect(context).not.toBeNull();
    expect(context?.name).toBe("Alice");
    expect(context?.email).toBe("alice@example.com");
  });

  it("returns null for non-existent user", async () => {
    const context = await create_user_context(9999);
    expect(context).toBeNull();
  });
});