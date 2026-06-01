import { db, admin } from '../config/firebase';
import { COUPON_EXPIRY_DAYS, FREE_SHIPPING_VALUE, PLATFORM_FEE_PERCENT } from '@scentresort/shared';
import type { UserCoupon, CouponType } from '@scentresort/shared';

export async function createCoupon(
  userId: string,
  spinId: string,
  type: CouponType,
  amountOff: number,
  description: string
): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + COUPON_EXPIRY_DAYS);

  const ref = db.collection('user_coupons').doc();
  await ref.set({
    userId,
    spinId,
    type,
    description,
    amountOff,
    usedOnOrderId: null,
    status: 'active',
    expiresAt: expiresAt.toISOString(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return ref.id;
}

export async function getUserActiveCoupons(userId: string): Promise<(UserCoupon & { id: string })[]> {
  const now = new Date().toISOString();
  const snap = await db
    .collection('user_coupons')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as UserCoupon & { id: string }))
    .filter((c) => c.expiresAt > now);
}

export async function getUserCouponHistory(userId: string): Promise<(UserCoupon & { id: string })[]> {
  const snap = await db
    .collection('user_coupons')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserCoupon & { id: string }));
}

export interface DiscountResult {
  totalDiscount: number;
  adjustedAmount: number;
  adjustedPlatformFee: number;
  sellerPayout: number;
  appliedCouponIds: string[];
}

export async function applyCoupons(
  couponIds: string[],
  userId: string,
  orderId: string,
  orderAmount: number
): Promise<DiscountResult> {
  const platformFee = Math.round(orderAmount * PLATFORM_FEE_PERCENT / 100);
  const sellerPayout = orderAmount - platformFee;

  if (!couponIds.length) {
    return {
      totalDiscount: 0,
      adjustedAmount: orderAmount,
      adjustedPlatformFee: platformFee,
      sellerPayout,
      appliedCouponIds: [],
    };
  }

  // Use a transaction to prevent double-spend
  return db.runTransaction(async (tx) => {
    const couponDocs = await Promise.all(
      couponIds.map((id) => tx.get(db.collection('user_coupons').doc(id)))
    );

    const now = new Date().toISOString();
    let totalDiscount = 0;
    const validIds: string[] = [];

    for (const doc of couponDocs) {
      if (!doc.exists) continue;
      const coupon = doc.data()!;

      // Validate ownership, status, and expiry
      if (coupon.userId !== userId) continue;
      if (coupon.status !== 'active') continue;
      if (coupon.expiresAt <= now) continue;

      totalDiscount += coupon.amountOff;
      validIds.push(doc.id);
    }

    // Cap discount at platform fee (seller always gets full payout)
    totalDiscount = Math.min(totalDiscount, platformFee);

    const adjustedPlatformFee = platformFee - totalDiscount;
    const adjustedAmount = sellerPayout + adjustedPlatformFee;

    // Mark coupons as used
    for (const id of validIds) {
      tx.update(db.collection('user_coupons').doc(id), {
        status: 'used',
        usedOnOrderId: orderId,
      });
    }

    return {
      totalDiscount,
      adjustedAmount,
      adjustedPlatformFee,
      sellerPayout,
      appliedCouponIds: validIds,
    };
  });
}

export async function restoreCoupons(couponIds: string[]): Promise<void> {
  if (!couponIds.length) return;

  const batch = db.batch();
  for (const id of couponIds) {
    batch.update(db.collection('user_coupons').doc(id), {
      status: 'active',
      usedOnOrderId: null,
    });
  }
  await batch.commit();
}
