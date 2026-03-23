import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/auth.types.js';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '24h';

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateToken(userId: number, username: string, email: string): string {
    return jwt.sign({ userId, username, email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });
  },

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  },
};
