import { db } from '../config/firebase';
import { admin } from '../config/firebase';
import { FLAG_THRESHOLD, type ReportReason } from '@scentresort/shared';

export async function reportListing(params: {
  listingId: string;
  reporterId: string;
  reporterEmail: string;
  reason: ReportReason;
  description: string;
}): Promise<{ reportId: string; listingHidden: boolean }> {
  // Check for duplicate report
  const existing = await db
    .collection('reports')
    .where('listingId', '==', params.listingId)
    .where('reporterId', '==', params.reporterId)
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new Error('You have already reported this listing');
  }

  // Verify listing exists and is active
  const listingRef = db.collection('listings').doc(params.listingId);
  const listing = await listingRef.get();

  if (!listing.exists) throw new Error('Listing not found');
  if (listing.data()!.status !== 'active') {
    throw new Error('Listing is not active');
  }

  // Create report and increment flag count atomically
  const reportRef = db.collection('reports').doc();
  let listingHidden = false;

  await db.runTransaction(async (tx) => {
    const listingSnap = await tx.get(listingRef);
    const currentFlags = listingSnap.data()!.flagCount || 0;
    const newFlags = currentFlags + 1;

    tx.create(reportRef, {
      listingId: params.listingId,
      reporterId: params.reporterId,
      reporterEmail: params.reporterEmail,
      reason: params.reason,
      description: params.description,
      status: 'pending',
      adminReviewedBy: null,
      adminNotes: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updates: Record<string, unknown> = {
      flagCount: newFlags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (newFlags >= FLAG_THRESHOLD) {
      updates.status = 'under_review';
      listingHidden = true;
    }

    tx.update(listingRef, updates);
  });

  return { reportId: reportRef.id, listingHidden };
}

export async function reinstateListing(
  listingId: string,
  adminUid: string
): Promise<void> {
  const listingRef = db.collection('listings').doc(listingId);
  const listing = await listingRef.get();

  if (!listing.exists) throw new Error('Listing not found');
  if (listing.data()!.status !== 'under_review') {
    throw new Error('Listing is not under review');
  }

  // Reset flag count and reactivate
  await listingRef.update({
    status: 'active',
    flagCount: 0,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Mark all pending reports as dismissed
  const reports = await db
    .collection('reports')
    .where('listingId', '==', listingId)
    .where('status', '==', 'pending')
    .get();

  const batch = db.batch();
  for (const report of reports.docs) {
    batch.update(report.ref, {
      status: 'reviewed_dismissed',
      adminReviewedBy: adminUid,
      adminNotes: 'Listing reinstated by admin',
    });
  }
  await batch.commit();
}

export async function removeListing(
  listingId: string,
  adminUid: string
): Promise<void> {
  const listingRef = db.collection('listings').doc(listingId);
  const listing = await listingRef.get();

  if (!listing.exists) throw new Error('Listing not found');

  await listingRef.update({
    status: 'removed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Mark all pending reports as valid
  const reports = await db
    .collection('reports')
    .where('listingId', '==', listingId)
    .where('status', '==', 'pending')
    .get();

  const batch = db.batch();
  for (const report of reports.docs) {
    batch.update(report.ref, {
      status: 'reviewed_valid',
      adminReviewedBy: adminUid,
      adminNotes: 'Listing removed by admin',
    });
  }
  await batch.commit();
}

export async function banSeller(
  sellerUid: string,
  adminUid: string,
  reason: string
): Promise<void> {
  const userRef = db.collection('users').doc(sellerUid);
  const user = await userRef.get();

  if (!user.exists) throw new Error('User not found');

  await userRef.update({
    banned: true,
    banReason: reason,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Remove all active listings by this seller
  const listings = await db
    .collection('listings')
    .where('sellerId', '==', sellerUid)
    .where('status', '==', 'active')
    .get();

  const batch = db.batch();
  for (const listing of listings.docs) {
    batch.update(listing.ref, {
      status: 'removed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}
