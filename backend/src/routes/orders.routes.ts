import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import { getParam } from '../types';
import {
  createOrder,
  cancelOrder,
  markShipped,
  confirmDelivery,
  openDispute,
  getOrderById,
  getOrdersByUser,
} from '../services/order.service';

const router = Router();
router.use(requireAuth);

// POST /orders/checkout — Create order + PaymentIntent for a listing
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const buyer = (req as AuthenticatedRequest).user;
    const { listingId } = req.body;

    if (!listingId) {
      res.status(400).json({ error: 'bad_request', message: 'listingId is required' });
      return;
    }

    // Fetch listing
    const listingSnap = await db.collection('listings').doc(listingId).get();
    if (!listingSnap.exists) {
      res.status(404).json({ error: 'not_found', message: 'Listing not found' });
      return;
    }

    const listing = { id: listingSnap.id, ...listingSnap.data() } as any;

    if (listing.status !== 'active') {
      res.status(400).json({ error: 'bad_request', message: 'Listing is no longer available' });
      return;
    }

    if (listing.sellerId === buyer.uid) {
      res.status(400).json({ error: 'bad_request', message: 'You cannot buy your own listing' });
      return;
    }

    // Check seller has active Stripe account
    const sellerSnap = await db.collection('users').doc(listing.sellerId).get();
    const seller = sellerSnap.data();
    if (!seller?.stripeAccountId || seller.stripeAccountStatus !== 'active') {
      res.status(400).json({ error: 'bad_request', message: 'Seller has not set up payments' });
      return;
    }

    const result = await createOrder(listing, buyer);

    res.status(201).json(result);
  } catch (err: any) {
    console.error('Checkout error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to create order' });
  }
});

// GET /orders — List user's orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const role = (req.query.role as string) === 'seller' ? 'seller' : 'buyer';
    const orders = await getOrdersByUser(user.uid, role);
    res.json({ orders });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to list orders' });
  }
});

// GET /orders/:id — Get order detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const orderId = getParam(req, 'id');
    const order = await getOrderById(orderId);

    if (!order) {
      res.status(404).json({ error: 'not_found', message: 'Order not found' });
      return;
    }

    // Only buyer, seller, or admin can view
    if ((order as any).buyerId !== user.uid && (order as any).sellerId !== user.uid && user.role !== 'admin') {
      res.status(403).json({ error: 'forbidden', message: 'Not authorized to view this order' });
      return;
    }

    res.json({ order });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get order' });
  }
});

// POST /orders/:id/ship — Seller marks order as shipped
router.post('/:id/ship', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const orderId = getParam(req, 'id');
    const { trackingNumber, trackingCarrier } = req.body;

    if (!trackingNumber || !trackingCarrier) {
      res.status(400).json({ error: 'bad_request', message: 'trackingNumber and trackingCarrier are required' });
      return;
    }

    await markShipped(orderId, user.uid, trackingNumber.trim(), trackingCarrier.trim());
    res.json({ message: 'Order marked as shipped' });
  } catch (err: any) {
    console.error('Ship error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to mark as shipped' });
  }
});

// POST /orders/:id/confirm-delivery — Buyer confirms receipt
router.post('/:id/confirm-delivery', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const orderId = getParam(req, 'id');
    await confirmDelivery(orderId, user.uid);
    res.json({ message: 'Delivery confirmed. Escrow window started.' });
  } catch (err: any) {
    console.error('Confirm delivery error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to confirm delivery' });
  }
});

// POST /orders/:id/dispute — Buyer opens dispute within escrow window
router.post('/:id/dispute', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const orderId = getParam(req, 'id');
    const { reason, description } = req.body;

    if (!reason || !description) {
      res.status(400).json({ error: 'bad_request', message: 'reason and description are required' });
      return;
    }

    await openDispute(orderId, user.uid, reason.trim(), description.trim());
    res.json({ message: 'Dispute opened. Funds are frozen pending review.' });
  } catch (err: any) {
    console.error('Dispute error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to open dispute' });
  }
});

// POST /orders/:id/cancel — Cancel order (before shipment only)
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const orderId = getParam(req, 'id');
    await cancelOrder(orderId, user.uid);
    res.json({ message: 'Order cancelled and refunded' });
  } catch (err: any) {
    console.error('Cancel error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to cancel order' });
  }
});

export default router;
