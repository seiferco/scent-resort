import { db, admin } from '../config/firebase';
import { stripe } from './stripe.service';
import { WHEEL_SPIN_PRICE, FREE_SPIN_COOLDOWN_HOURS, FREE_SHIPPING_VALUE } from '@scentresort/shared';
import {
  generateServerSeed,
  hashServerSeed,
  calculateRoll,
  selectPrize,
} from '../utils/provablyFair';
import { createCoupon } from './coupon.service';
import { createPrintifyOrder } from './printify.service';
import { sendPrizeWonAdminNotification } from './email.service';
import type { WheelConfig, WheelPrize, FulfillmentChoice, ShippingAddress } from '@scentresort/shared';

async function fulfillDigitalPrize(
  spinRef: FirebaseFirestore.DocumentReference,
  spinId: string,
  userId: string,
  prize: WheelPrize
): Promise<void> {
  if (prize.type === 'credit') {
    const amount = prize.creditAmount || prize.value;
    const couponId = await createCoupon(
      userId, spinId, 'site_credit',
      amount,
      `${prize.name} — saves up to ${(amount / 100).toFixed(2)} off the service fee`
    );
    await spinRef.update({ couponId });
  } else if (prize.type === 'voucher') {
    const couponId = await createCoupon(
      userId, spinId, 'free_shipping',
      FREE_SHIPPING_VALUE,
      `${prize.name} — saves up to ${(FREE_SHIPPING_VALUE / 100).toFixed(2)} off the service fee`
    );
    await spinRef.update({ couponId });
  }
}

export async function getActiveWheel(): Promise<(WheelConfig & { id: string }) | null> {
  const snap = await db
    .collection('wheels')
    .where('active', '==', true)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as WheelConfig & { id: string };
}

export async function initiateSpin(
  userId: string,
  userDisplayName: string,
  wheelId: string,
  clientSeed: string
): Promise<{ spinId: string; clientSecret: string; serverSeedHash: string }> {
  const wheelDoc = await db.collection('wheels').doc(wheelId).get();
  if (!wheelDoc.exists) throw new Error('Wheel not found');
  const wheel = wheelDoc.data() as WheelConfig;
  if (!wheel.active) throw new Error('Wheel is not active');

  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);

  const spinCount = await db
    .collection('spins')
    .where('userId', '==', userId)
    .count()
    .get();
  const nonce = spinCount.data().count;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: WHEEL_SPIN_PRICE,
    currency: 'usd',
    metadata: {
      type: 'wheel_spin',
      userId,
      wheelId,
    },
  });

  const spinRef = db.collection('spins').doc();
  await spinRef.set({
    userId,
    userDisplayName,
    wheelId,
    prizeId: null,
    prizeName: null,
    prizeImage: null,
    prizeValue: null,
    prizeType: null,
    status: 'pending_payment',
    isFree: false,
    amountPaid: WHEEL_SPIN_PRICE,
    stripePaymentIntentId: paymentIntent.id,
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    spinId: spinRef.id,
    clientSecret: paymentIntent.client_secret!,
    serverSeedHash,
  };
}

export async function executeSpin(spinId: string): Promise<{
  prize: WheelPrize;
  serverSeed: string;
}> {
  const spinRef = db.collection('spins').doc(spinId);
  const spinDoc = await spinRef.get();
  if (!spinDoc.exists) throw new Error('Spin not found');
  const spin = spinDoc.data()!;

  if (spin.prizeId) throw new Error('Spin already executed');

  const wheelDoc = await db.collection('wheels').doc(spin.wheelId).get();
  if (!wheelDoc.exists) throw new Error('Wheel not found');
  const wheel = wheelDoc.data() as WheelConfig;

  const roll = calculateRoll(spin.serverSeed, spin.clientSeed, spin.nonce);
  const prize = selectPrize(roll, wheel.prizes);

  const isDigital = prize.type === 'credit' || prize.type === 'voucher';
  const status = isDigital ? 'prize_credited' : 'completed';

  await spinRef.update({
    prizeId: prize.id,
    prizeName: prize.name,
    prizeImage: prize.image,
    prizeValue: prize.value,
    prizeType: prize.type,
    status,
  });

  // Auto-create coupon for digital prizes
  if (isDigital) {
    await fulfillDigitalPrize(spinRef, spinId, spin.userId, prize);
  }

  // Notify admin for physical prizes that need manual fulfillment
  if (prize.type === 'fragrance' || prize.type === 'sample') {
    sendPrizeWonAdminNotification({
      userDisplayName: spin.userDisplayName,
      prizeName: prize.name,
      prizeValue: prize.value,
      spinId,
    }).catch(() => {});
  }

  return { prize, serverSeed: spin.serverSeed };
}

export async function executeFreeSpin(
  userId: string,
  userDisplayName: string,
  wheelId: string,
  clientSeed: string
): Promise<{ spinId: string; prize: WheelPrize; serverSeed: string; serverSeedHash: string }> {
  const cooldownTime = new Date();
  cooldownTime.setHours(cooldownTime.getHours() - FREE_SPIN_COOLDOWN_HOURS);

  const recentFree = await db
    .collection('spins')
    .where('userId', '==', userId)
    .where('isFree', '==', true)
    .where('createdAt', '>', cooldownTime)
    .limit(1)
    .get();

  if (!recentFree.empty) {
    const lastSpin = recentFree.docs[0].data();
    const lastSpinTime = lastSpin.createdAt.toDate();
    const nextAvailable = new Date(lastSpinTime.getTime() + FREE_SPIN_COOLDOWN_HOURS * 60 * 60 * 1000);
    const hoursLeft = Math.ceil((nextAvailable.getTime() - Date.now()) / (1000 * 60 * 60));
    throw new Error(`Free spin available in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`);
  }

  const wheelDoc = await db.collection('wheels').doc(wheelId).get();
  if (!wheelDoc.exists) throw new Error('Wheel not found');
  const wheel = wheelDoc.data() as WheelConfig;
  if (!wheel.active) throw new Error('Wheel is not active');

  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);

  const spinCount = await db
    .collection('spins')
    .where('userId', '==', userId)
    .count()
    .get();
  const nonce = spinCount.data().count;

  const roll = calculateRoll(serverSeed, clientSeed, nonce);
  const prize = selectPrize(roll, wheel.prizes);

  const isDigital = prize.type === 'credit' || prize.type === 'voucher';
  const status = isDigital ? 'prize_credited' : 'completed';

  const spinRef = db.collection('spins').doc();
  await spinRef.set({
    userId,
    userDisplayName,
    wheelId,
    prizeId: prize.id,
    prizeName: prize.name,
    prizeImage: prize.image,
    prizeValue: prize.value,
    prizeType: prize.type,
    status,
    isFree: true,
    amountPaid: 0,
    stripePaymentIntentId: null,
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Auto-create coupon for digital prizes
  if (isDigital) {
    await fulfillDigitalPrize(spinRef, spinRef.id, userId, prize);
  }

  return { spinId: spinRef.id, prize, serverSeed, serverSeedHash };
}

export async function claimPrize(
  spinId: string,
  userId: string,
  fulfillmentMethod: FulfillmentChoice,
  shippingAddress?: ShippingAddress
): Promise<{ couponId?: string }> {
  const spinRef = db.collection('spins').doc(spinId);
  const spinDoc = await spinRef.get();
  if (!spinDoc.exists) throw new Error('Spin not found');
  const spin = spinDoc.data()!;

  if (spin.userId !== userId) throw new Error('Not your spin');
  if (spin.status !== 'completed') throw new Error('Prize cannot be claimed');
  if (spin.prizeType === 'credit' || spin.prizeType === 'voucher') {
    throw new Error('Digital prizes are credited automatically');
  }

  if (fulfillmentMethod === 'credit') {
    // Merch (sticker pack) can't be converted to credit — too low value
    if (spin.prizeType === 'merch') {
      throw new Error('This prize can only be shipped');
    }

    // Create a coupon for the prize retail value
    const couponId = await createCoupon(
      userId, spinId, 'site_credit',
      spin.prizeValue,
      `${spin.prizeName} (store credit) — saves up to ${(spin.prizeValue / 100).toFixed(2)} off the service fee`
    );
    await spinRef.update({
      fulfillmentMethod: 'credit',
      couponId,
      status: 'prize_credited',
    });
    return { couponId };
  }

  // Ship method
  if (!shippingAddress) throw new Error('Shipping address required');

  if (spin.prizeType === 'merch') {
    // Auto-fulfill via Printify
    try {
      const printifyOrderId = await createPrintifyOrder(spinId, shippingAddress);
      await spinRef.update({
        fulfillmentMethod: 'ship',
        shippingAddress,
        printifyOrderId,
        status: 'fulfilled',
      });
    } catch (err) {
      console.error('Printify order failed:', err);
      // Fall back to manual fulfillment if Printify fails
      await spinRef.update({
        fulfillmentMethod: 'ship',
        shippingAddress,
        status: 'prize_shipped',
      });
    }
  } else {
    // Fragrance/sample — manual fulfillment
    await spinRef.update({
      fulfillmentMethod: 'ship',
      shippingAddress,
      status: 'prize_shipped',
    });
  }

  return {};
}

export async function getRecentWins(limit = 20): Promise<any[]> {
  const snap = await db
    .collection('spins')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    userDisplayName: doc.data().userDisplayName,
    prizeName: doc.data().prizeName,
    prizeImage: doc.data().prizeImage,
    prizeValue: doc.data().prizeValue,
    prizeType: doc.data().prizeType,
    createdAt: doc.data().createdAt,
  }));
}

export async function getUserSpins(userId: string): Promise<any[]> {
  const snap = await db
    .collection('spins')
    .where('userId', '==', userId)
    .get();

  const spins = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort newest first in memory (avoids composite index requirement)
  spins.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt?._seconds * 1000 || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt?._seconds * 1000 || 0;
    return bTime - aTime;
  });

  return spins.slice(0, 50);
}
