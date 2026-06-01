import { Router, Request, Response } from 'express';
import express from 'express';
import { constructWebhookEvent } from '../services/stripe.service';
import { confirmPayment } from '../services/order.service';
import { syncAccountStatus } from '../services/stripe.service';
import { executeSpin } from '../services/wheel.service';
import { db, admin } from '../config/firebase';
import { sendOrderConfirmation } from '../services/email.service';

const router = Router();

// Raw body parser for Stripe signature verification
router.use(express.raw({ type: 'application/json' }));

// POST /webhooks/stripe — Handle Stripe webhook events
router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event;
  try {
    event = constructWebhookEvent(req.body as Buffer, signature);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  // Idempotency check
  const eventRef = db.collection('stripe_events').doc(event.id);
  const existing = await eventRef.get();
  if (existing.exists) {
    res.json({ received: true, duplicate: true });
    return;
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        const metadata = paymentIntent.metadata || {};

        if (metadata.type === 'wheel_spin') {
          // Mystery wheel spin payment confirmed
          const spinSnap = await db.collection('spins')
            .where('stripePaymentIntentId', '==', paymentIntent.id)
            .limit(1)
            .get();
          if (!spinSnap.empty) {
            await executeSpin(spinSnap.docs[0].id);
          }
        } else if (metadata.orderId) {
          // Regular marketplace order payment
          const orderId = metadata.orderId;
          const chargeId = paymentIntent.latest_charge as string;

          if (chargeId) {
            await confirmPayment(orderId, chargeId);

            // Send order confirmation email
            const orderSnap = await db.collection('orders').doc(orderId).get();
            if (orderSnap.exists) {
              const orderData = orderSnap.data()!;
              sendOrderConfirmation({
                id: orderId,
                listingTitle: orderData.listingTitle,
                amount: orderData.amount,
                buyerId: orderData.buyerId,
                sellerDisplayName: orderData.sellerDisplayName,
              });
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          const orderRef = db.collection('orders').doc(orderId);
          const snap = await orderRef.get();
          if (snap.exists && snap.data()?.status === 'pending_payment') {
            await orderRef.update({
              status: 'cancelled',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Restore listing
            const listingId = snap.data()?.listingId;
            if (listingId) {
              await db.collection('listings').doc(listingId).update({
                status: 'active',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as any;
        const uid = account.metadata?.firebaseUid;
        if (uid) {
          await syncAccountStatus(uid, account.id);
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    // Mark event as processed
    await eventRef.set({
      type: event.type,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

export default router;
