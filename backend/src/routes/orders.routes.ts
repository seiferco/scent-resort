import { Router, Request, Response } from 'express';
import { requireAuth, requireVerifiedEmail, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import { getParam } from '../types';
import {
  sendShippedNotification,
  sendDeliveryConfirmed,
  sendDisputeOpened,
  sendRefundIssued,
} from '../services/email.service';
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

// POST /orders/checkout — Create order + PaymentIntent (requires accepted offer)
router.post('/checkout', requireVerifiedEmail, async (req: Request, res: Response) => {
  try {
    const buyer = (req as AuthenticatedRequest).user;
    const { listingId, offerId, couponIds } = req.body;

    if (!listingId || !offerId) {
      res.status(400).json({ error: 'bad_request', message: 'listingId and offerId are required' });
      return;
    }

    // Validate the accepted offer
    const offerSnap = await db.collection('offers').doc(offerId).get();
    if (!offerSnap.exists) {
      res.status(404).json({ error: 'not_found', message: 'Offer not found' });
      return;
    }
    const offer = offerSnap.data()!;

    if (offer.status !== 'accepted') {
      res.status(400).json({ error: 'bad_request', message: 'Offer has not been accepted' });
      return;
    }
    if (offer.buyerId !== buyer.uid) {
      res.status(403).json({ error: 'forbidden', message: 'This offer does not belong to you' });
      return;
    }
    if (offer.listingId !== listingId) {
      res.status(400).json({ error: 'bad_request', message: 'Offer does not match listing' });
      return;
    }

    // Fetch listing
    const listingSnap = await db.collection('listings').doc(listingId).get();
    if (!listingSnap.exists) {
      res.status(404).json({ error: 'not_found', message: 'Listing not found' });
      return;
    }

    const listing = { id: listingSnap.id, ...listingSnap.data() } as any;

    if (listing.status !== 'pending_sale') {
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

    const result = await createOrder(listing, buyer, couponIds || []);

    // Link order to offer
    await db.collection('offers').doc(offerId).update({
      orderId: result.orderId,
    });

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

    // Send shipped email to buyer
    const shippedOrder = await getOrderById(orderId);
    if (shippedOrder) {
      sendShippedNotification({
        id: orderId,
        listingTitle: (shippedOrder as any).listingTitle,
        buyerId: (shippedOrder as any).buyerId,
        trackingNumber: trackingNumber.trim(),
        trackingCarrier: trackingCarrier.trim(),
      });
    }

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

    // Send delivery confirmed email to seller
    const deliveredOrder = await getOrderById(orderId);
    if (deliveredOrder) {
      sendDeliveryConfirmed({
        id: orderId,
        listingTitle: (deliveredOrder as any).listingTitle,
        sellerId: (deliveredOrder as any).sellerId,
        sellerPayout: (deliveredOrder as any).sellerPayout,
      });
    }

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

    // Send dispute emails to both parties
    const disputedOrder = await getOrderById(orderId);
    if (disputedOrder) {
      sendDisputeOpened({
        id: orderId,
        listingTitle: (disputedOrder as any).listingTitle,
        buyerId: (disputedOrder as any).buyerId,
        sellerId: (disputedOrder as any).sellerId,
        disputeReason: reason.trim(),
      });
    }

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

    // Send refund email to buyer
    const cancelledOrder = await getOrderById(orderId);
    if (cancelledOrder) {
      sendRefundIssued({
        id: orderId,
        listingTitle: (cancelledOrder as any).listingTitle,
        buyerId: (cancelledOrder as any).buyerId,
        amount: (cancelledOrder as any).amount,
      });
    }

    res.json({ message: 'Order cancelled and refunded' });
  } catch (err: any) {
    console.error('Cancel error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to cancel order' });
  }
});

export default router;
