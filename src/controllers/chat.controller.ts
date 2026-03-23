import { Response } from 'express';
import { AuthRequest } from '../types/auth.types.js';
import { groqService } from '../services/index.js';
import { messageRepository } from '../repositories/index.js';
import rateLimit from 'express-rate-limit';

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
      res.status(400).json({ error: 'text field is required and must be non-empty' });
      return;
    }

    if (text.length > 4000) {
      res.status(400).json({ error: 'text exceeds maximum length of 4000 characters' });
      return;
    }

    const type: MessageType = VALID_MESSAGE_TYPES.includes(rawType) ? rawType : 'text';

    const start = Date.now();

    // Save user message
    await messageRepository.create(userId, 'user', text.trim(), type);

    // Fetch last 10 messages for context
    const history = await messageRepository.findRecent(userId, 10);

    // Call Groq — exclude the message we just saved (last item)
    const { content, tokensUsed, model } = await groqService.chat(
      history.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content })),
      text.trim()
    );

    const processingTimeMs = Date.now() - start;

    // Save assistant response
    const assistantMessage = await messageRepository.create(
      userId,
      'assistant',
      content,
      'text',
      tokensUsed,
      processingTimeMs
    );

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

    const { messages, total } = await messageRepository.findPaginated(userId, limit, offset);

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
      const { messages } = await messageRepository.findPaginated(userId, 1000, 0);
      await Promise.all(messages.map((m: any) => messageRepository.delete(m.id, userId)));
      res.json({ deleted: messages.length, message: `Successfully deleted ${messages.length} message(s)` });
      return;
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      res.status(400).json({ error: 'messageIds array or clearAll: true is required' });
      return;
    }

    const results = await Promise.all(
      messageIds.map((id: number) => messageRepository.delete(id, userId))
    );
    const deleted = results.filter(Boolean).length;
    res.json({ deleted, message: `Successfully deleted ${deleted} message(s)` });
  },
};
