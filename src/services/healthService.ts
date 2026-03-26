import pool from '../config/database.js';
import { logger } from '../utils/logger.js';

const CTX = 'HealthService';

export const healthService = {
  async checkDatabase(): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      logger.debug(CTX, 'Database ping successful');
      return true;
    } catch (err: any) {
      logger.error(CTX, 'Database ping failed', { error: err.message });
      return false;
    }
  },
};
