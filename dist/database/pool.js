import { Pool } from "pg";
import * as dotenv from 'dotenv';
export { initialize_pool };
dotenv.config();
export let pool;
/**
 * Creates a new database connection pool. If test_mode is true, it will use the test database configuration. Otherwise, it will use the actual database configuration, specified in a .env file.
 * @param test_mode - Whether to use the test database configuration or the actual database configuration.
 */
async function initialize_pool(test_mode) {
    if (test_mode) {
        pool = _test_pool;
    }
    else {
        pool = _actual_pool;
    }
    await connectPool();
}
const _test_pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL ??
        "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
});
const _actual_pool = new Pool({
    host: process.env.CLIENT_HOST,
    port: 5432,
    database: process.env.CLIENT_DATABASE,
    user: process.env.CLIENT_USER,
    password: process.env.CLIENT_PASSWORD,
});
export async function connectPool() {
    const client = await pool.connect();
    client.release();
}
//# sourceMappingURL=pool.js.map