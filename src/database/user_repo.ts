import { pool } from "./pool.ts";

export class UserRepository {
  async create(email: string, display_name: string) {
    const result = await pool.query(
      `
      insert into public.users (email, name)
      values ($1, $2)
      returning *
      `,
      [email, display_name]
    );

    return result.rows[0];
  }
}