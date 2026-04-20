import { Client } from 'pg';
import { create_user_context } from '../user.ts';
import * as dotenv from 'dotenv';
dotenv.config();

console.log("Starting database connection...");

const client = await new Client({
    host: process.env.CLIENT_HOST,
    port: 5432,
    database: process.env.CLIENT_DATABASE,
    user: process.env.CLIENT_USER,
    password: process.env.CLIENT_PASSWORD,
}).connect();

console.log("Connected to database");

const user = await create_user_context(0);

if (!user) {
    throw new Error("User 0 does not exist, cannot create user context.");
}

const x1:boolean = await user.blacklist_store("fantasy_store");
console.log(x1);

const x2:Array<string> = await user.get_blacklisted_stores();
console.log(x2);

const x3:boolean = await user.blacklist_brand("dole");
console.log(x3);

const x4:Array<number> = await user.get_blacklisted_brands();
console.log(x4);

const x5:boolean = await user.unblacklist_store("fantasy_store");
console.log(x5);

await client.end();