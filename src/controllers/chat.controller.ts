import { Response } from 'express';
import { AuthRequest } from '../types/auth.types.js';
import { groqService } from '../services/index.js';
import { messageRepository } from '../repositories/index.js';

export const chatController = {
  async send(req: AuthRequest, res: Response): Promise<void> {
    const { text, type = 'text' } = req.body;
    const userId = req.user!.userId;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text field is required' });
      return;
    }

    const start = Date.now();

    // Save user message
    await messageRepository.create(userId, 'user', text, type);

    // Fetch last 10 messages for context
    const history = await messageRepository.findRecent(userId, 10);

    // Call Groq
    const { content, tokensUsed } = await groqService.chat(
      history.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content })),
      text
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
      metadata: { tokensUsed, processingTime: processingTimeMs },
    });
  },

  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const messages = await messageRepository.findByUserId(userId);
    const paginated = messages.slice(offset, offset + limit);

    res.json({
      messages: paginated,
      pagination: {
        limit,
        offset,
        total: messages.length,
        hasMore: offset + limit < messages.length,
      },
    });
  },

  async deleteMessages(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { messageIds, clearAll } = req.body;

    if (clearAll) {
      const all = await messageRepository.findByUserId(userId);
      await Promise.all(all.map((m: any) => messageRepository.delete(m.id, userId)));
      res.json({ deleted: all.length, message: `Successfully deleted ${all.length} message(s)` });
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
