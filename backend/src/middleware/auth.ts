import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';
import type { User } from '@scentresort/shared';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface TokenRequest extends Request {
  decodedToken: DecodedIdToken;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      res.status(401).json({ error: 'unauthorized', message: 'User record not found' });
      return;
    }

    const userData = userDoc.data() as User;

    if (userData.banned) {
      res.status(403).json({ error: 'forbidden', message: 'Account has been banned' });
      return;
    }

    (req as AuthenticatedRequest).user = { ...userData, uid: decoded.uid };
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
  }
}

// Middleware that requires email verification (must come after requireAuth)
export async function requireVerifiedEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing authorization header' });
    return;
  }

  const token = header.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    if (!decoded.email_verified) {
      res.status(403).json({ error: 'email_not_verified', message: 'Please verify your email address before performing this action' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
  }
}

// Lighter middleware that only verifies the Firebase token (no Firestore doc required)
// Used for the /auth/register endpoint where the doc doesn't exist yet
export async function requireToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(token);
    (req as TokenRequest).decodedToken = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
  }
}
