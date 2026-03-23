import { Router } from 'express';
import { chatController, chatRateLimiter } from '../controllers/chat.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(authenticateToken);

router.post('/send', chatRateLimiter, asyncHandler(chatController.send));
router.get('/history', asyncHandler(chatController.getHistory));
router.delete('/delete', asyncHandler(chatController.deleteMessages));

export default router;
