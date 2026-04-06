import { truncate_tables, close_pool } from "./test_helpers.ts";
import { create_user_context } from "../user.ts";
import { UserRepository } from "../user_repo.ts";

beforeEach(async () => {
  await truncate_tables();
});

afterAll(async () => {
  await close_pool();
});

test("creates user successfully", async () => {
  const repo = new UserRepository();

  const user = await repo.create(
    "alice@example.com",
    "Alice"
  );

  expect(user.email).toBe("alice@example.com");
});