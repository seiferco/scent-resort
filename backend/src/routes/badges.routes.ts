import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';

const router = Router();

// GET /badges — Returns unread/pending counts for nav badges
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { uid } = (req as AuthenticatedRequest).user;

    const [offersSnap, convosSnap, ordersSnap] = await Promise.all([
      // Pending offers where user is the seller
      db.collection('offers')
        .where('sellerId', '==', uid)
        .where('status', '==', 'pending')
        .count()
        .get(),

      // Conversations with unread messages
      db.collection('conversations')
        .where('participantIds', 'array-contains', uid)
        .get(),

      // Orders needing attention (paid but not shipped for sellers, shipped for buyers)
      db.collection('orders')
        .where('sellerId', '==', uid)
        .where('status', '==', 'paid')
        .count()
        .get(),
    ]);

    // Count unread conversations
    let unreadMessages = 0;
    for (const doc of convosSnap.docs) {
      const data = doc.data();
      if (data.buyerId === uid && data.buyerUnread) unreadMessages++;
      else if (data.sellerId === uid && data.sellerUnread) unreadMessages++;
    }

    res.json({
      offers: offersSnap.data().count,
      messages: unreadMessages,
      orders: ordersSnap.data().count,
    });
  } catch (err) {
    console.error('Badge counts error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get badge counts' });
  }
});

export default router;
