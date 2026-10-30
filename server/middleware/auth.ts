import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbService } from '../db';

export const JWT_SECRET = process.env.JWT_SECRET || 'visionpulse_ultra_secure_jwt_secret_token_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Missing Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    const user = dbService.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User session expired or user not found.' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    next();
  } catch (err: any) {
    return res.status(401).json({
      error: 'Invalid or expired authentication token. Please log in again.',
    });
  }
}
