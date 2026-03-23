import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(authenticateToken);

router.post('/send', asyncHandler(chatController.send));
router.get('/history', asyncHandler(chatController.getHistory));
router.delete('/delete', asyncHandler(chatController.deleteMessages));

export default router;
