import { pool } from "../pool.js";
export async function truncate_tables() {
    await pool.query(`
    TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;
    TRUNCATE TABLE public.store_blacklists RESTART IDENTITY CASCADE;
    TRUNCATE TABLE public.stores RESTART IDENTITY CASCADE;
    TRUNCATE TABLE public.brands RESTART IDENTITY CASCADE;
    TRUNCATE TABLE public.brand_blacklists RESTART IDENTITY CASCADE;
    TRUNCATE TABLE public.store_memberships RESTART IDENTITY CASCADE;
  `);
}
export async function close_pool() {
    await pool.end();
}
//# sourceMappingURL=test_helpers.js.map