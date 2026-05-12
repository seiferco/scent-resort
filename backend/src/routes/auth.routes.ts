import { Router, Request, Response } from 'express';
import { requireToken, requireAuth, TokenRequest, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import { admin } from '../config/firebase';

const router = Router();

// POST /auth/register — Create user doc on first login
router.post('/register', requireToken, async (req: Request, res: Response) => {
  try {
    const decoded = (req as TokenRequest).decodedToken;
    const userRef = db.collection('users').doc(decoded.uid);
    const existing = await userRef.get();

    if (existing.exists) {
      res.json({ message: 'User already registered', user: { uid: decoded.uid, ...existing.data() } });
      return;
    }

    const newUser = {
      email: decoded.email || '',
      displayName: decoded.name || decoded.email?.split('@')[0] || 'User',
      photoURL: decoded.picture || null,
      bio: '',
      location: '',
      preferredPayment: '',
      role: 'user' as const,
      banned: false,
      banReason: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(newUser);
    res.status(201).json({ message: 'User created', user: { ...newUser, uid: decoded.uid } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to register user' });
  }
});

// PUT /auth/profile — Update own profile
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { displayName, bio, location, preferredPayment, photoURL } = req.body;

    const updates: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (typeof displayName === 'string' && displayName.trim()) {
      updates.displayName = displayName.trim().slice(0, 50);
    }
    if (typeof bio === 'string') {
      updates.bio = bio.trim().slice(0, 500);
    }
    if (typeof location === 'string') {
      updates.location = location.trim().slice(0, 100);
    }
    if (typeof preferredPayment === 'string') {
      updates.preferredPayment = preferredPayment.trim().slice(0, 200);
    }
    if (typeof photoURL === 'string' || photoURL === null) {
      updates.photoURL = photoURL;
    }

    await db.collection('users').doc(user.uid).update(updates);

    const updated = await db.collection('users').doc(user.uid).get();
    res.json({ user: { uid: user.uid, ...updated.data() } });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to update profile' });
  }
});

// GET /auth/me — Get own profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  res.json({ user });
});

export default router;
