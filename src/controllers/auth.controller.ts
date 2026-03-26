import { Request, Response } from 'express';
import { authService } from '../services/index.js';
import { userRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';

const CTX = 'AuthController';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      logger.warn(CTX, 'Register failed — missing fields', { email });
      res.status(400).json({ error: 'username, email and password are required' });
      return;
    }

    if (password.length < 6) {
      logger.warn(CTX, 'Register failed — password too short', { email });
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      logger.warn(CTX, 'Register failed — email already exists', { email });
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await authService.hashPassword(password);
    const user = await userRepository.create(username, email, passwordHash);
    const token = authService.generateToken(user.id, user.username, user.email);

    logger.info(CTX, 'User registered successfully', { userId: user.id, email: user.email });
    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn(CTX, 'Login failed — missing fields');
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      logger.warn(CTX, 'Login failed — user not found', { email });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await authService.verifyPassword(password, user.password_hash);
    if (!valid) {
      logger.warn(CTX, 'Login failed — wrong password', { email });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = authService.generateToken(user.id, user.username, user.email);
    logger.info(CTX, 'User logged in', { userId: user.id, email: user.email });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  },
};
