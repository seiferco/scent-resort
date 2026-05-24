import { Router, Request, Response } from 'express';
import { requireAuth, requireVerifiedEmail, AuthenticatedRequest } from '../middleware/auth';
import { db, admin } from '../config/firebase';
import { getParam } from '../types';

const router = Router();

// POST /reviews — Create a review for a seller
router.post('/', requireAuth, requireVerifiedEmail, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { sellerId, rating, comment } = req.body;

    if (!sellerId || typeof sellerId !== 'string') {
      res.status(400).json({ error: 'bad_request', message: 'sellerId is required' });
      return;
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      res.status(400).json({ error: 'bad_request', message: 'Rating must be an integer 1-5' });
      return;
    }

    if (typeof comment !== 'string' || comment.trim().length < 5) {
      res.status(400).json({ error: 'bad_request', message: 'Comment must be at least 5 characters' });
      return;
    }

    if (sellerId === user.uid) {
      res.status(400).json({ error: 'bad_request', message: 'Cannot review yourself' });
      return;
    }

    // Check seller exists
    const sellerDoc = await db.collection('users').doc(sellerId).get();
    if (!sellerDoc.exists) {
      res.status(404).json({ error: 'not_found', message: 'Seller not found' });
      return;
    }

    // Check if user already reviewed this seller
    const existing = await db
      .collection('reviews')
      .where('buyerId', '==', user.uid)
      .where('sellerId', '==', sellerId)
      .limit(1)
      .get();

    if (!existing.empty) {
      res.status(400).json({ error: 'already_reviewed', message: 'You have already reviewed this seller' });
      return;
    }

    const review = {
      sellerId,
      buyerId: user.uid,
      buyerDisplayName: user.displayName || 'User',
      buyerPhotoURL: user.photoURL || null,
      rating,
      comment: comment.trim().slice(0, 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection('reviews').add(review);
    res.status(201).json({ id: ref.id, ...review });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to create review' });
  }
});

// GET /reviews/seller/:id — Get reviews for a seller
router.get('/seller/:id', async (req: Request, res: Response) => {
  try {
    const sellerId = getParam(req, 'id');

    const snap = await db
      .collection('reviews')
      .where('sellerId', '==', sellerId)
      .orderBy('createdAt', 'desc')
      .get();

    const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Calculate average
    let avgRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r: any) => acc + r.rating, 0);
      avgRating = Math.round((sum / reviews.length) * 10) / 10;
    }

    res.json({ reviews, avgRating, count: reviews.length });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get reviews' });
  }
});

export default router;
