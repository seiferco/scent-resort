import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { getParam } from '../types';

const router = Router();

// GET /users/:id — Public profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getParam(req, 'id');
    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'not_found', message: 'User not found' });
      return;
    }

    const data = doc.data()!;

    // Return only public fields
    res.json({
      user: {
        uid: doc.id,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        bio: data.bio || '',
        location: data.location || '',
        preferredPayment: data.preferredPayment || '',
        stripeAccountStatus: data.stripeAccountStatus || 'pending',
        createdAt: data.createdAt,
      },
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get user' });
  }
});

// GET /users/:id/listings — Public listings by user
router.get('/:id/listings', async (req: Request, res: Response) => {
  try {
    const userId = getParam(req, 'id');
    const snap = await db
      .collection('listings')
      .where('sellerId', '==', userId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .get();

    const listings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ listings });
  } catch (err) {
    console.error('Get user listings error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get user listings' });
  }
});

// GET /users/:id/sold — Past sales by user
router.get('/:id/sold', async (req: Request, res: Response) => {
  try {
    const userId = getParam(req, 'id');
    const snap = await db
      .collection('listings')
      .where('sellerId', '==', userId)
      .where('status', '==', 'sold')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const listings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ listings });
  } catch (err) {
    console.error('Get user sold listings error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get sold listings' });
  }
});

export default router;
