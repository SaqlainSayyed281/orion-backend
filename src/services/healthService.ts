import pool from '../config/database.js';

export const healthService = {
  async checkDatabase(): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },
};
