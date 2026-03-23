import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/auth.types.js';

const SALT_ROUNDS = 10;
const JWT_EXPIRY = '24h';

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateToken(userId: number, username: string, email: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is not set');
    return jwt.sign({ userId, username, email }, secret, {
      expiresIn: JWT_EXPIRY,
    });
  },

  verifyToken(token: string): JwtPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is not set');
    return jwt.verify(token, secret) as JwtPayload;
  },
};
