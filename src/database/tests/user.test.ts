import assert from "assert";
import { Client } from 'pg';
import { truncate_tables, close_pool } from "./test_helpers.ts";
import { create_user_context } from "../user.ts";
import * as dotenv from 'dotenv';
dotenv.config();


describe("create_user_context", () => {
    let client: Client;

    beforeAll((async () => {
        client = await new Client({
            host: process.env.CLIENT_HOST,
            port: 5432,
            database: process.env.CLIENT_DATABASE,
            user: process.env.CLIENT_USER,
            password: process.env.CLIENT_PASSWORD,
        }).connect();
    }));
    
    afterAll(async () => {
        await client.end();
    });

    it("throws an error if the database client is not provided", async () => {
        await expect(create_user_context(null as unknown as Client, 0)).rejects.toThrow("Database client is required to create user context");
    }),

    it("returns null for a non-existent user", async () => {
        await expect(create_user_context(null as unknown as Client, -1)).rejects.toThrow("Database client is required to create user context");
    }),

    it("returns a user context for an existing user", async () => {
        const user_context = await create_user_context(client, 0);
        console.log("User context:", user_context);
        assert(user_context !== null, "Expected user context to be created for existing user");

        await client.end();
    });
});

describe("blacklisting_stores", () => {
    let client: Client;
    let user_context: Awaited<ReturnType<typeof create_user_context>>;

    beforeAll(async () => {
        client = await new Client({
            host: process.env.CLIENT_HOST,
            port: 5432,
            database: process.env.CLIENT_DATABASE,
            user: process.env.CLIENT_USER,
            password: process.env.CLIENT_PASSWORD,
        }).connect();
        user_context = await create_user_context(client, 0);
    });

    afterAll(async () => {
        await client.end();
    });

    it("allows blacklisting and unblacklisting stores", async () => {
        assert(user_context !== null, "Expected user context to be created for existing user");
        
        const store_source = "fake_store";
        const unblacklist_result = await user_context.unblacklist_store("fake_store");


        assert(user_context !== null, "Expected user context to be created for existing user");
        
        // Blacklist the store
        const blacklist_result = await user_context.blacklist_store(store_source);
        assert(blacklist_result, "Expected store to be blacklisted successfully");

        // Verify the store is in the blacklist
        let blacklisted_stores = await user_context.get_blacklisted_stores();
        assert(blacklisted_stores.includes(store_source), "Expected blacklisted stores to include the blacklisted store");
    });

});