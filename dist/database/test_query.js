import { Client } from 'pg';
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
const res = await client.query("SELECT * FROM users");
console.log(res.rows);
await client.end();
//# sourceMappingURL=test_query.js.map