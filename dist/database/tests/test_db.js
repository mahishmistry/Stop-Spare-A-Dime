import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
let container;
let pool;
export async function start_test_db() {
    container = await new PostgreSqlContainer("postgres:16").start();
    pool = new Pool({
        host: container.getHost(),
        port: container.getPort(),
        user: container.getUsername(),
        password: container.getPassword(),
        database: container.getDatabase(),
    });
    pool = new Pool({
        host: container.getHost(),
        port: container.getPort(),
        database: container.getDatabase(),
        user: container.getUsername(),
        password: container.getPassword(),
    });
    await pool.query(`SELECT 1`);
}
export function get_pool() {
    if (!pool) {
        throw new Error("Test DB pool has not been started yet.");
    }
    return pool;
}
export async function run_migrations() {
    const db = get_pool();
    // Example only. Replace with your real migration tool or SQL files.
    await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );
  `);
}
export async function clear_db() {
    const db = get_pool();
    await db.query(`
    TRUNCATE TABLE users RESTART IDENTITY CASCADE;
  `);
}
export async function stop_test_db() {
    if (pool) {
        await pool.end();
    }
    if (container) {
        await container.stop();
    }
}
//# sourceMappingURL=test_db.js.map