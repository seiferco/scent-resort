import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireVerifiedEmail, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import { admin } from '../config/firebase';
import * as moderationService from '../services/moderation.service';
import { MAX_LISTING_IMAGES, type ReportReason } from '@scentresort/shared';
import { getParam } from '../types';

const router = Router();

const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  brand: z.string().min(1).max(100),
  fragranceName: z.string().min(1).max(200),
  size: z.string().min(1).max(50),
  condition: z.enum(['new_sealed', 'new_open_box', 'lightly_used', 'partially_used']),
  price: z.number().int().positive(),
  currency: z.literal('usd'),
  images: z.array(z.string().url()).min(1).max(MAX_LISTING_IMAGES),
});

const reportSchema = z.object({
  reason: z.enum(['suspected_counterfeit', 'misleading_description', 'prohibited_item', 'other']),
  description: z.string().min(10).max(2000),
});

// GET /listings — Browse active listings (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const startAfter = req.query.startAfter as string | undefined;

    let query = db
      .collection('listings')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startAfter) {
      const cursor = await db.collection('listings').doc(startAfter).get();
      if (cursor.exists) {
        query = query.startAfter(cursor);
      }
    }

    const snapshot = await query.get();
    const listings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.json({ listings, hasMore: listings.length === limit });
  } catch (err) {
    console.error('List listings error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch listings' });
  }
});

// GET /listings/:id — Single listing detail (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('listings').doc(getParam(req, 'id')).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'not_found', message: 'Listing not found' });
      return;
    }

    const listing = doc.data()!;
    if (listing.status !== 'active' && listing.status !== 'sold') {
      res.status(404).json({ error: 'not_found', message: 'Listing not found' });
      return;
    }

    res.json({ id: doc.id, ...listing });
  } catch (err) {
    console.error('Get listing error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch listing' });
  }
});

// POST /listings — Create listing (any logged-in user)
router.post('/', requireAuth, requireVerifiedEmail, async (req: Request, res: Response) => {
  try {
    const parsed = createListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', message: parsed.error.issues });
      return;
    }

    const user = (req as AuthenticatedRequest).user;
    const data = parsed.data;

    const listingRef = db.collection('listings').doc();
    await listingRef.set({
      sellerId: user.uid,
      sellerDisplayName: user.displayName,
      ...data,
      status: 'active',
      flagCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: listingRef.id, message: 'Listing created' });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to create listing' });
  }
});

// PUT /listings/:id — Update listing (owner only)
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const ref = db.collection('listings').doc(getParam(req, 'id'));
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'not_found', message: 'Listing not found' });
      return;
    }

    if (doc.data()!.sellerId !== user.uid && user.role !== 'admin') {
      res.status(403).json({ error: 'forbidden', message: 'Not the owner of this listing' });
      return;
    }

    if (doc.data()!.status === 'sold') {
      res.status(400).json({ error: 'bad_request', message: 'Cannot edit a sold listing' });
      return;
    }

    const parsed = createListingSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', message: parsed.error.issues });
      return;
    }

    await ref.update({
      ...parsed.data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Listing updated' });
  } catch (err) {
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to update listing' });
  }
});

// POST /listings/:id/mark-sold — Seller marks listing as sold
router.post('/:id/mark-sold', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const ref = db.collection('listings').doc(getParam(req, 'id'));
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'not_found', message: 'Listing not found' });
      return;
    }

    if (doc.data()!.sellerId !== user.uid && user.role !== 'admin') {
      res.status(403).json({ error: 'forbidden', message: 'Not the owner of this listing' });
      return;
    }

    await ref.update({
      status: 'sold',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Listing marked as sold' });
  } catch (err) {
    console.error('Mark sold error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to mark as sold' });
  }
});

// DELETE /listings/:id — Soft delete (owner only)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const ref = db.collection('listings').doc(getParam(req, 'id'));
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'not_found', message: 'Listing not found' });
      return;
    }

    if (doc.data()!.sellerId !== user.uid && user.role !== 'admin') {
      res.status(403).json({ error: 'forbidden', message: 'Not the owner of this listing' });
      return;
    }

    await ref.update({
      status: 'removed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Listing removed' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to remove listing' });
  }
});

// POST /listings/:id/report — Flag a listing (any logged-in user)
router.post('/:id/report', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', message: parsed.error.issues });
      return;
    }

    const user = (req as AuthenticatedRequest).user;

    const result = await moderationService.reportListing({
      listingId: getParam(req, 'id'),
      reporterId: user.uid,
      reporterEmail: user.email,
      reason: parsed.data.reason as ReportReason,
      description: parsed.data.description,
    });

    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === 'You have already reported this listing') {
      res.status(409).json({ error: 'duplicate', message: err.message });
      return;
    }
    console.error('Report listing error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to report listing' });
  }
});

export default router;
