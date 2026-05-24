import { db, admin } from '../config/firebase';
import {
  createPaymentIntent,
  createTransfer,
  createRefund,
} from './stripe.service';
import {
  PLATFORM_FEE_PERCENT,
  ESCROW_WINDOW_HOURS,
} from '@scentresort/shared';
import type { Listing, User, OrderStatus } from '@scentresort/shared';

// ── Create Order ──

export async function createOrder(listing: Listing, buyer: User) {
  const platformFee = Math.round(listing.price * PLATFORM_FEE_PERCENT / 100);
  const sellerPayout = listing.price - platformFee;

  // Atomic: check listing is still active and reserve it
  const orderRef = db.collection('orders').doc();
  const listingRef = db.collection('listings').doc(listing.id);

  const { paymentIntent } = await createPaymentIntent(listing.price, listing.currency, {
    orderId: orderRef.id,
    listingId: listing.id,
    buyerId: buyer.uid,
    sellerId: listing.sellerId,
  });

  await db.runTransaction(async (tx) => {
    const listingSnap = await tx.get(listingRef);
    const listingData = listingSnap.data();

    if (!listingData || listingData.status !== 'active') {
      throw new Error('Listing is no longer available');
    }

    tx.update(listingRef, { status: 'pending_sale', updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    tx.set(orderRef, {
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0] || '',
      buyerId: buyer.uid,
      buyerDisplayName: buyer.displayName,
      sellerId: listing.sellerId,
      sellerDisplayName: listing.sellerDisplayName,
      amount: listing.price,
      platformFee,
      sellerPayout,
      currency: listing.currency,
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: null,
      stripeTransferId: null,
      status: 'pending_payment' as OrderStatus,
      trackingNumber: null,
      trackingCarrier: null,
      shippedAt: null,
      deliveredAt: null,
      escrowReleaseAt: null,
      completedAt: null,
      disputeReason: null,
      disputeDescription: null,
      disputeOpenedAt: null,
      disputeResolvedAt: null,
      disputeResolution: null,
      disputeAdminId: null,
      disputeAdminNotes: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return {
    orderId: orderRef.id,
    clientSecret: paymentIntent.client_secret!,
    amount: listing.price,
    platformFee,
    sellerPayout,
  };
}

// ── Status Transitions ──

export async function confirmPayment(orderId: string, chargeId: string) {
  const orderRef = db.collection('orders').doc(orderId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) throw new Error('Order not found');
    const order = snap.data()!;

    if (order.status !== 'pending_payment') {
      throw new Error('Order is not pending payment');
    }

    tx.update(orderRef, {
      status: 'paid',
      stripeChargeId: chargeId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mark listing as sold
    tx.update(db.collection('listings').doc(order.listingId), {
      status: 'sold',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export async function cancelOrder(orderId: string, userId: string) {
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error('Order not found');
  const order = snap.data()!;

  if (order.buyerId !== userId && order.sellerId !== userId) {
    throw new Error('Not authorized');
  }

  if (order.status !== 'paid' && order.status !== 'pending_payment') {
    throw new Error('Order can only be cancelled before shipment');
  }

  // Only refund if payment was completed
  if (order.status === 'paid') {
    await createRefund(order.stripePaymentIntentId);
  }

  const batch = db.batch();
  batch.update(orderRef, {
    status: 'cancelled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  // Restore listing to active
  batch.update(db.collection('listings').doc(order.listingId), {
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await batch.commit();
}

export async function markShipped(
  orderId: string,
  sellerId: string,
  trackingNumber: string,
  trackingCarrier: string
) {
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error('Order not found');
  const order = snap.data()!;

  if (order.sellerId !== sellerId) throw new Error('Not authorized');
  if (order.status !== 'paid') throw new Error('Order must be in paid status to ship');

  await orderRef.update({
    status: 'shipped',
    trackingNumber,
    trackingCarrier,
    shippedAt: new Date().toISOString(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function confirmDelivery(orderId: string, buyerId: string) {
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error('Order not found');
  const order = snap.data()!;

  if (order.buyerId !== buyerId) throw new Error('Not authorized');
  if (order.status !== 'shipped') throw new Error('Order must be shipped to confirm delivery');

  const now = new Date();
  const escrowRelease = new Date(now.getTime() + ESCROW_WINDOW_HOURS * 60 * 60 * 1000);

  await orderRef.update({
    status: 'delivered',
    deliveredAt: now.toISOString(),
    escrowReleaseAt: escrowRelease.toISOString(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function openDispute(
  orderId: string,
  buyerId: string,
  reason: string,
  description: string
) {
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error('Order not found');
  const order = snap.data()!;

  if (order.buyerId !== buyerId) throw new Error('Not authorized');
  if (order.status !== 'delivered') throw new Error('Can only dispute delivered orders');

  // Check we're within the escrow window
  if (order.escrowReleaseAt && new Date(order.escrowReleaseAt) <= new Date()) {
    throw new Error('Escrow window has expired');
  }

  await orderRef.update({
    status: 'disputed',
    disputeReason: reason,
    disputeDescription: description,
    disputeOpenedAt: new Date().toISOString(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function resolveDispute(
  orderId: string,
  adminId: string,
  resolution: 'seller_wins' | 'buyer_wins',
  adminNotes: string
) {
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error('Order not found');
  const order = snap.data()!;

  if (order.status !== 'disputed') throw new Error('Order is not in dispute');

  if (resolution === 'buyer_wins') {
    // Refund the buyer
    await createRefund(order.stripePaymentIntentId);

    await orderRef.update({
      status: 'refunded',
      disputeResolution: resolution,
      disputeResolvedAt: new Date().toISOString(),
      disputeAdminId: adminId,
      disputeAdminNotes: adminNotes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Release funds to seller
    const sellerDoc = await db.collection('users').doc(order.sellerId).get();
    const seller = sellerDoc.data()!;

    if (!seller.stripeAccountId) throw new Error('Seller has no Stripe account');

    const transfer = await createTransfer(
      order.sellerPayout,
      seller.stripeAccountId,
      order.stripeChargeId,
      { orderId }
    );

    await orderRef.update({
      status: 'completed',
      stripeTransferId: transfer.id,
      completedAt: new Date().toISOString(),
      disputeResolution: resolution,
      disputeResolvedAt: new Date().toISOString(),
      disputeAdminId: adminId,
      disputeAdminNotes: adminNotes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

// ── Queries ──

export async function getOrderById(orderId: string) {
  const snap = await db.collection('orders').doc(orderId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getOrdersByUser(userId: string, role: 'buyer' | 'seller') {
  const field = role === 'buyer' ? 'buyerId' : 'sellerId';
  const snap = await db.collection('orders')
    .where(field, '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getDisputedOrders() {
  const snap = await db.collection('orders')
    .where('status', '==', 'disputed')
    .orderBy('disputeOpenedAt', 'desc')
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
