import { db, admin } from '../config/firebase';
import { OFFER_EXPIRY_DAYS } from '@scentresort/shared';
import type { Listing, User, OfferStatus } from '@scentresort/shared';

// ── Create Offer ──

export async function createOffer(listing: Listing, buyer: User, message: string) {
  const offerRef = db.collection('offers').doc();
  const listingRef = db.collection('listings').doc(listing.id);

  await db.runTransaction(async (tx) => {
    const listingSnap = await tx.get(listingRef);
    const listingData = listingSnap.data();

    if (!listingData || listingData.status !== 'active') {
      throw new Error('Listing is no longer available');
    }

    if (buyer.uid === listing.sellerId) {
      throw new Error('You cannot make an offer on your own listing');
    }

    // Check for existing pending or accepted offer from this buyer
    const existingSnap = await db.collection('offers')
      .where('listingId', '==', listing.id)
      .where('buyerId', '==', buyer.uid)
      .where('status', 'in', ['pending', 'accepted'])
      .get();

    if (!existingSnap.empty) {
      throw new Error('You already have an active offer on this listing');
    }

    tx.set(offerRef, {
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0] || '',
      buyerId: buyer.uid,
      buyerDisplayName: buyer.displayName,
      sellerId: listing.sellerId,
      sellerDisplayName: listing.sellerDisplayName,
      amount: listing.price,
      currency: listing.currency,
      message,
      status: 'pending' as OfferStatus,
      acceptedAt: null,
      declinedAt: null,
      orderId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return offerRef.id;
}

// ── Accept Offer ──

export async function acceptOffer(offerId: string, sellerId: string) {
  const offerRef = db.collection('offers').doc(offerId);
  let offerData: FirebaseFirestore.DocumentData;

  await db.runTransaction(async (tx) => {
    const offerSnap = await tx.get(offerRef);
    if (!offerSnap.exists) throw new Error('Offer not found');
    offerData = offerSnap.data()!;

    if (offerData.status !== 'pending') {
      throw new Error('Offer is not pending');
    }

    if (offerData.sellerId !== sellerId) {
      throw new Error('Not authorized');
    }

    tx.update(offerRef, {
      status: 'accepted' as OfferStatus,
      acceptedAt: new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.update(db.collection('listings').doc(offerData.listingId), {
      status: 'pending_sale',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  // Batch-decline all other pending offers on the same listing
  const otherPendingSnap = await db.collection('offers')
    .where('listingId', '==', offerData!.listingId)
    .where('status', '==', 'pending')
    .get();

  const declinedOfferIds: string[] = [];
  const filteredDocs = otherPendingSnap.docs.filter((doc) => doc.id !== offerId);

  if (filteredDocs.length > 0) {
    const batch = db.batch();
    for (const doc of filteredDocs) {
      batch.update(doc.ref, {
        status: 'declined' as OfferStatus,
        declinedAt: new Date().toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      declinedOfferIds.push(doc.id);
    }
    await batch.commit();
  }

  const acceptedSnap = await offerRef.get();
  const acceptedOffer = { id: acceptedSnap.id, ...acceptedSnap.data() };

  return { acceptedOffer, declinedOfferIds };
}

// ── Decline Offer ──

export async function declineOffer(offerId: string, sellerId: string) {
  const offerRef = db.collection('offers').doc(offerId);
  const snap = await offerRef.get();
  if (!snap.exists) throw new Error('Offer not found');
  const offer = snap.data()!;

  if (offer.status !== 'pending') throw new Error('Offer is not pending');
  if (offer.sellerId !== sellerId) throw new Error('Not authorized');

  await offerRef.update({
    status: 'declined' as OfferStatus,
    declinedAt: new Date().toISOString(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ── Withdraw Offer ──

export async function withdrawOffer(offerId: string, buyerId: string) {
  const offerRef = db.collection('offers').doc(offerId);
  const snap = await offerRef.get();
  if (!snap.exists) throw new Error('Offer not found');
  const offer = snap.data()!;

  if (offer.status !== 'pending') throw new Error('Offer is not pending');
  if (offer.buyerId !== buyerId) throw new Error('Not authorized');

  await offerRef.update({
    status: 'withdrawn' as OfferStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ── Queries ──

export async function getOffersByUser(userId: string, role: 'buyer' | 'seller') {
  const field = role === 'buyer' ? 'buyerId' : 'sellerId';
  const snap = await db.collection('offers')
    .where(field, '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getAcceptedOfferForBuyer(listingId: string, buyerId: string) {
  const snap = await db.collection('offers')
    .where('listingId', '==', listingId)
    .where('buyerId', '==', buyerId)
    .where('status', '==', 'accepted')
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getBuyerOfferForListing(listingId: string, buyerId: string) {
  const snap = await db.collection('offers')
    .where('listingId', '==', listingId)
    .where('buyerId', '==', buyerId)
    .where('status', 'in', ['pending', 'accepted'])
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getOffersByListing(listingId: string) {
  const snap = await db.collection('offers')
    .where('listingId', '==', listingId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getOfferById(offerId: string) {
  const snap = await db.collection('offers').doc(offerId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Expire Stale Offers ──

export async function expireStaleOffers() {
  const cutoff = new Date(Date.now() - OFFER_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const snap = await db.collection('offers')
    .where('status', '==', 'pending')
    .where('createdAt', '<=', cutoff.toISOString())
    .get();

  if (snap.empty) return { expiredOffers: 0 };

  const batch = db.batch();
  for (const doc of snap.docs) {
    batch.update(doc.ref, {
      status: 'expired' as OfferStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  return { expiredOffers: snap.size };
}
