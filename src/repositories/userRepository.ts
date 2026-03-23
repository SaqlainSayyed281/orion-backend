import pool from '../config/database.js';

export const userRepository = {
  async create(username: string, email: string, passwordHash: string) {
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );
    return rows[0];
  },

  async findByEmail(email: string) {
    const { rows } = await pool.query(
      `SELECT id, username, email, password_hash, created_at
       FROM users WHERE email = $1`,
      [email]
    );
    return rows[0] ?? null;
  },

  async findById(id: number) {
    const { rows } = await pool.query(
      `SELECT id, username, email, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },
};
