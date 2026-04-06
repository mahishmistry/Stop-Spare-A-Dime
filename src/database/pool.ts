import { Pool } from "pg";

export const pool = new Pool({
  connectionString:
    process.env.TEST_DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
});