import assert from "assert";
import { Client } from 'pg';
import { create_user_context } from "./user.ts";

describe("create_user_context", () => {
    it("returns null for a non-existent user", async () => {
        await expect(create_user_context(null as unknown as Client, -1)).rejects.toThrow("Database client is required to create user context");
    });
});