import { db, admin } from '../config/firebase';
import { createTransfer } from './stripe.service';
import {
  ESCROW_WINDOW_HOURS,
  AUTO_DELIVERY_DAYS,
  SELLER_SHIP_DEADLINE_DAYS,
} from '@scentresort/shared';
import { createRefund } from './stripe.service';
import { sendEscrowReleased, sendStaleCancelledNotification } from './email.service';

// ── Process Escrow Releases ──
// Called by cron. Finds delivered orders past the escrow window and releases funds.

export async function processEscrowReleases() {
  const now = new Date();

  const snap = await db.collection('orders')
    .where('status', '==', 'delivered')
    .where('escrowReleaseAt', '<=', now.toISOString())
    .get();

  const results = { released: 0, errors: 0 };

  for (const doc of snap.docs) {
    const order = doc.data();

    try {
      // Fetch seller's Stripe account
      const sellerSnap = await db.collection('users').doc(order.sellerId).get();
      const seller = sellerSnap.data();

      if (!seller?.stripeAccountId) {
        console.error(`Escrow release failed: seller ${order.sellerId} has no Stripe account`);
        results.errors++;
        continue;
      }

      // Create transfer to seller
      const transfer = await createTransfer(
        order.sellerPayout,
        seller.stripeAccountId,
        order.stripeChargeId,
        { orderId: doc.id }
      );

      await doc.ref.update({
        status: 'completed',
        stripeTransferId: transfer.id,
        completedAt: now.toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      sendEscrowReleased({
        id: doc.id,
        listingTitle: order.listingTitle,
        sellerId: order.sellerId,
        sellerPayout: order.sellerPayout,
      });

      results.released++;
    } catch (err) {
      console.error(`Escrow release error for order ${doc.id}:`, err);
      results.errors++;
    }
  }

  return results;
}

// ── Process Auto-Deliveries ──
// Shipped orders where buyer hasn't confirmed after AUTO_DELIVERY_DAYS.

export async function processAutoDeliveries() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - AUTO_DELIVERY_DAYS);

  const snap = await db.collection('orders')
    .where('status', '==', 'shipped')
    .where('shippedAt', '<=', cutoff.toISOString())
    .get();

  const now = new Date();
  const escrowRelease = new Date(now.getTime() + ESCROW_WINDOW_HOURS * 60 * 60 * 1000);
  let count = 0;

  for (const doc of snap.docs) {
    try {
      await doc.ref.update({
        status: 'delivered',
        deliveredAt: now.toISOString(),
        escrowReleaseAt: escrowRelease.toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      count++;
    } catch (err) {
      console.error(`Auto-delivery error for order ${doc.id}:`, err);
    }
  }

  return { autoDelivered: count };
}

// ── Process Stale Orders ──
// Paid orders where seller hasn't shipped within SELLER_SHIP_DEADLINE_DAYS.

export async function processStaleOrders() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SELLER_SHIP_DEADLINE_DAYS);

  const snap = await db.collection('orders')
    .where('status', '==', 'paid')
    .where('createdAt', '<=', cutoff.toISOString())
    .get();

  let count = 0;

  for (const doc of snap.docs) {
    const order = doc.data();
    try {
      // Auto-cancel and refund
      await createRefund(order.stripePaymentIntentId);

      const batch = db.batch();
      batch.update(doc.ref, {
        status: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      batch.update(db.collection('listings').doc(order.listingId), {
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await batch.commit();

      sendStaleCancelledNotification({
        id: doc.id,
        listingTitle: order.listingTitle,
        buyerId: order.buyerId,
        amount: order.amount,
      });

      count++;
    } catch (err) {
      console.error(`Stale order cancel error for order ${doc.id}:`, err);
    }
  }

  return { staleCancelled: count };
}

// ── Run All Cron Tasks ──

export async function runEscrowCron() {
  const results: Record<string, any> = {};

  try {
    const releases = await processEscrowReleases();
    Object.assign(results, releases);
  } catch (err) {
    console.error('processEscrowReleases failed:', err);
    results.escrowError = String(err);
  }

  try {
    const deliveries = await processAutoDeliveries();
    Object.assign(results, deliveries);
  } catch (err) {
    console.error('processAutoDeliveries failed:', err);
    results.deliveryError = String(err);
  }

  try {
    const stale = await processStaleOrders();
    Object.assign(results, stale);
  } catch (err) {
    console.error('processStaleOrders failed:', err);
    results.staleError = String(err);
  }

  return results;
}
