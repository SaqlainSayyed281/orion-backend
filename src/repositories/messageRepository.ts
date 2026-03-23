import pool from '../config/database.js';

export const messageRepository = {
  async create(
    userId: number,
    role: 'user' | 'assistant',
    content: string,
    messageType: 'text' | 'voice' = 'text',
    tokensUsed?: number,
    processingTimeMs?: number
  ) {
    const { rows } = await pool.query(
      `INSERT INTO messages (user_id, role, content, message_type, tokens_used, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, role, content, messageType, tokensUsed ?? null, processingTimeMs ?? null]
    );
    return rows[0];
  },

  async findByUserId(userId: number) {
    const { rows } = await pool.query(
      `SELECT * FROM messages
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );
    return rows;
  },

  async findPaginated(userId: number, limit: number, offset: number) {
    const { rows: messages } = await pool.query(
      `SELECT * FROM messages
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM messages WHERE user_id = $1`,
      [userId]
    );
    return { messages, total: parseInt(countRows[0].count) };
  },

  async findRecent(userId: number, limit: number = 20) {
    const { rows } = await pool.query(
      `SELECT * FROM messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows.reverse();
  },

  async delete(messageId: number, userId: number) {
    const { rows } = await pool.query(
      `DELETE FROM messages
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [messageId, userId]
    );
    return rows[0] ?? null;
  },
};
