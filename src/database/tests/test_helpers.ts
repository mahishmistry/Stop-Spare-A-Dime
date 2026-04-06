import { pool } from "../pool.ts"

export async function truncate_tables() {
  await pool.query(`
    TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;
  `);
}

export async function close_pool() {
  await pool.end();
}