import { Request, Response } from 'express';
import { authService } from '../services/index.js';
import { userRepository } from '../repositories/index.js';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'username, email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await authService.hashPassword(password);
    const user = await userRepository.create(username, email, passwordHash);
    const token = authService.generateToken(user.id, user.username, user.email);

    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await authService.verifyPassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = authService.generateToken(user.id, user.username, user.email);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  },
};
