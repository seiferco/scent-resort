import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { db, admin } from '../config/firebase';
import * as moderationService from '../services/moderation.service';
import { getDisputedOrders, resolveDispute } from '../services/order.service';
import { getParam } from '../types';

const router = Router();

router.use(requireAuth, requireAdmin);

// GET /admin/pending-listings — Listings awaiting review
router.get('/pending-listings', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection('listings')
      .where('status', '==', 'pending_review')
      .orderBy('createdAt', 'asc')
      .get();

    const listings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ listings });
  } catch (err) {
    console.error('Pending listings error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch pending listings' });
  }
});

// POST /admin/listings/:id/approve — Approve a pending listing
router.post('/listings/:id/approve', async (req: Request, res: Response) => {
  try {
    const ref = db.collection('listings').doc(getParam(req, 'id'));
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'not_found', message: 'Listing not found' });
      return;
    }

    if (doc.data()!.status !== 'pending_review') {
      res.status(400).json({ error: 'bad_request', message: 'Listing is not pending review' });
      return;
    }

    await ref.update({
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Listing approved' });
  } catch (err) {
    console.error('Approve listing error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to approve listing' });
  }
});

// POST /admin/listings/:id/reject — Reject a pending listing with reason
router.post('/listings/:id/reject', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ reason: z.string().min(5).max(1000) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', message: 'A rejection reason (min 5 chars) is required' });
      return;
    }

    const ref = db.collection('listings').doc(getParam(req, 'id'));
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'not_found', message: 'Listing not found' });
      return;
    }

    if (doc.data()!.status !== 'pending_review') {
      res.status(400).json({ error: 'bad_request', message: 'Listing is not pending review' });
      return;
    }

    await ref.update({
      status: 'rejected',
      rejectionReason: parsed.data.reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Listing rejected' });
  } catch (err) {
    console.error('Reject listing error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to reject listing' });
  }
});

// GET /admin/flagged-listings
router.get('/flagged-listings', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection('listings')
      .where('status', '==', 'under_review')
      .orderBy('updatedAt', 'desc')
      .get();

    const listings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ listings });
  } catch (err) {
    console.error('Flagged listings error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch flagged listings' });
  }
});

// GET /admin/listings/:id/reports
router.get('/listings/:id/reports', async (req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection('reports')
      .where('listingId', '==', getParam(req, 'id'))
      .orderBy('createdAt', 'desc')
      .get();

    const reports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ reports });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch reports' });
  }
});

// POST /admin/listings/:id/reinstate
router.post('/listings/:id/reinstate', async (req: Request, res: Response) => {
  try {
    const adminUser = (req as AuthenticatedRequest).user;
    await moderationService.reinstateListing(getParam(req, 'id'), adminUser.uid);
    res.json({ message: 'Listing reinstated' });
  } catch (err: any) {
    console.error('Reinstate error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message });
  }
});

// POST /admin/listings/:id/remove
router.post('/listings/:id/remove', async (req: Request, res: Response) => {
  try {
    const adminUser = (req as AuthenticatedRequest).user;
    await moderationService.removeListing(getParam(req, 'id'), adminUser.uid);
    res.json({ message: 'Listing removed' });
  } catch (err: any) {
    console.error('Remove listing error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message });
  }
});

// POST /admin/users/:uid/ban
router.post('/users/:uid/ban', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ reason: z.string().min(5) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', message: parsed.error.issues });
      return;
    }

    const adminUser = (req as AuthenticatedRequest).user;
    await moderationService.banSeller(getParam(req, 'uid'), adminUser.uid, parsed.data.reason);
    res.json({ message: 'Seller banned' });
  } catch (err: any) {
    console.error('Ban seller error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message });
  }
});

// GET /admin/disputes — List disputed orders
router.get('/disputes', async (_req: Request, res: Response) => {
  try {
    const orders = await getDisputedOrders();
    res.json({ orders });
  } catch (err) {
    console.error('Get disputes error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch disputes' });
  }
});

// POST /admin/orders/:id/resolve-dispute — Resolve a dispute
router.post('/orders/:id/resolve-dispute', async (req: Request, res: Response) => {
  try {
    const adminUser = (req as AuthenticatedRequest).user;
    const { resolution, adminNotes } = req.body;

    if (!resolution || !['seller_wins', 'buyer_wins'].includes(resolution)) {
      res.status(400).json({ error: 'bad_request', message: 'resolution must be seller_wins or buyer_wins' });
      return;
    }

    await resolveDispute(getParam(req, 'id'), adminUser.uid, resolution, adminNotes || '');
    res.json({ message: `Dispute resolved: ${resolution}` });
  } catch (err: any) {
    console.error('Resolve dispute error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message });
  }
});

// ── Wheel Management ──

// GET /admin/wheel/spins — Spins needing fulfillment + stats
router.get('/wheel/spins', async (_req: Request, res: Response) => {
  try {
    // Get spins needing attention (physical prizes claimed)
    const pendingSnap = await db
      .collection('spins')
      .where('status', 'in', ['prize_shipped', 'completed', 'fulfilled'])
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const spins = pendingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Quick stats
    const totalSpinsSnap = await db.collection('spins').count().get();
    const paidSpinsSnap = await db
      .collection('spins')
      .where('isFree', '==', false)
      .count()
      .get();

    res.json({
      spins,
      stats: {
        totalSpins: totalSpinsSnap.data().count,
        paidSpins: paidSpinsSnap.data().count,
        revenue: paidSpinsSnap.data().count * 2500, // WHEEL_SPIN_PRICE
        pendingFulfillment: spins.filter((s: any) => s.status === 'prize_shipped').length,
      },
    });
  } catch (err) {
    console.error('Admin wheel spins error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch wheel spins' });
  }
});

// POST /admin/wheel/spins/:id/ship — Mark spin as shipped with tracking
router.post('/wheel/spins/:id/ship', async (req: Request, res: Response) => {
  try {
    const spinId = getParam(req, 'id');
    const { trackingNumber, trackingCarrier } = req.body;

    if (!trackingNumber) {
      res.status(400).json({ error: 'bad_request', message: 'Tracking number required' });
      return;
    }

    const spinRef = db.collection('spins').doc(spinId);
    const spinDoc = await spinRef.get();

    if (!spinDoc.exists) {
      res.status(404).json({ error: 'not_found', message: 'Spin not found' });
      return;
    }

    await spinRef.update({
      trackingNumber,
      trackingCarrier: trackingCarrier || null,
      status: 'fulfilled',
    });

    // Send shipping notification email to winner
    const spin = spinDoc.data()!;
    const userDoc = await db.collection('users').doc(spin.userId).get();
    if (userDoc.exists) {
      const { sendPrizeShippedNotification } = await import('../services/email.service');
      sendPrizeShippedNotification({
        email: userDoc.data()!.email,
        displayName: spin.userDisplayName,
        prizeName: spin.prizeName,
        trackingNumber,
        trackingCarrier: trackingCarrier || '',
      }).catch(() => {});
    }

    res.json({ message: 'Spin marked as shipped' });
  } catch (err) {
    console.error('Admin ship spin error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to update spin' });
  }
});

export default router;
