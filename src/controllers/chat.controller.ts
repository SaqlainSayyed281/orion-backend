import { Response } from 'express';
import { AuthRequest } from '../types/auth.types.js';
import { groqService } from '../services/index.js';
import { messageRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';
import rateLimit from 'express-rate-limit';

const CTX = 'ChatController';

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP — stays under Groq's 30/min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

const VALID_MESSAGE_TYPES = ['text', 'voice'] as const;
type MessageType = (typeof VALID_MESSAGE_TYPES)[number];

export const chatController = {
  async send(req: AuthRequest, res: Response): Promise<void> {
    const { text, type: rawType = 'text' } = req.body;
    const userId = req.user!.userId;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      logger.warn(CTX, 'Send failed — empty text', { userId });
      res.status(400).json({ error: 'text field is required and must be non-empty' });
      return;
    }

    if (text.length > 4000) {
      logger.warn(CTX, 'Send failed — text too long', { userId, length: text.length });
      res.status(400).json({ error: 'text exceeds maximum length of 4000 characters' });
      return;
    }

    const type: MessageType = VALID_MESSAGE_TYPES.includes(rawType) ? rawType : 'text';
    logger.info(CTX, 'Chat message received', { userId, type, textLength: text.trim().length });

    const start = Date.now();

    // Save user message
    await messageRepository.create(userId, 'user', text.trim(), type);
    logger.debug(CTX, 'User message persisted', { userId });

    // Fetch last 10 messages for context
    const history = await messageRepository.findRecent(userId, 10);
    logger.debug(CTX, 'Chat history fetched', { userId, historyCount: history.length });

    // Call Groq — exclude the message we just saved (last item)
    const { content, tokensUsed, model } = await groqService.chat(
      history.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content })),
      text.trim()
    );

    const processingTimeMs = Date.now() - start;
    logger.info(CTX, 'Groq response received', { userId, model, tokensUsed, processingTimeMs });

    // Save assistant response
    const assistantMessage = await messageRepository.create(
      userId,
      'assistant',
      content,
      'text',
      tokensUsed,
      processingTimeMs
    );
    logger.debug(CTX, 'Assistant message persisted', { userId, messageId: assistantMessage.id });

    res.json({
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        createdAt: assistantMessage.created_at,
      },
      metadata: { tokensUsed, processingTime: processingTimeMs, model },
    });
  },

  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    logger.info(CTX, 'Chat history requested', { userId, limit, offset });

    const { messages, total } = await messageRepository.findPaginated(userId, limit, offset);

    logger.debug(CTX, 'Chat history returned', { userId, count: messages.length, total });

    res.json({
      messages,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  },

  async deleteMessages(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { messageIds, clearAll } = req.body;

    if (clearAll) {
      logger.warn(CTX, 'Clearing all messages for user', { userId });
      const { messages } = await messageRepository.findPaginated(userId, 1000, 0);
      await Promise.all(messages.map((m: any) => messageRepository.delete(m.id, userId)));
      logger.info(CTX, 'All messages deleted', { userId, count: messages.length });
      res.json({ deleted: messages.length, message: `Successfully deleted ${messages.length} message(s)` });
      return;
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      logger.warn(CTX, 'Delete failed — no messageIds provided', { userId });
      res.status(400).json({ error: 'messageIds array or clearAll: true is required' });
      return;
    }

    logger.info(CTX, 'Deleting specific messages', { userId, messageIds });
    const results = await Promise.all(
      messageIds.map((id: number) => messageRepository.delete(id, userId))
    );
    const deleted = results.filter(Boolean).length;
    logger.info(CTX, 'Messages deleted', { userId, requested: messageIds.length, deleted });
    res.json({ deleted, message: `Successfully deleted ${deleted} message(s)` });
  },
};
