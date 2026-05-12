import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as AuthenticatedRequest).user;

  if (user.role !== 'admin') {
    res.status(403).json({ error: 'forbidden', message: 'Admin access required' });
    return;
  }

  next();
}
