import { Router, Request, Response } from 'express';
import { requireAuth, requireVerifiedEmail, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import { getParam } from '../types';
import {
  createOffer,
  acceptOffer,
  declineOffer,
  withdrawOffer,
  getOffersByUser,
  getOffersByListing,
  getBuyerOfferForListing,
} from '../services/offer.service';
import {
  sendNewOfferNotification,
  sendOfferAccepted,
  sendOfferDeclined,
} from '../services/email.service';

const router = Router();
router.use(requireAuth);

// POST /offers — Create an offer on a listing
router.post('/', requireVerifiedEmail, async (req: Request, res: Response) => {
  try {
    const buyer = (req as AuthenticatedRequest).user;
    const { listingId, message } = req.body;

    if (!listingId) {
      res.status(400).json({ error: 'bad_request', message: 'listingId is required' });
      return;
    }

    if (message && typeof message === 'string' && message.length > 500) {
      res.status(400).json({ error: 'bad_request', message: 'Message must be 500 characters or less' });
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

    // Fetch buyer user doc for displayName
    const buyerSnap = await db.collection('users').doc(buyer.uid).get();
    const buyerData = buyerSnap.data();

    const offerId = await createOffer(listing, buyer, message || '');

    // Fire-and-forget: notify seller
    sendNewOfferNotification({
      listingTitle: listing.title,
      sellerId: listing.sellerId,
      buyerDisplayName: buyerData?.displayName || 'A buyer',
      amount: listing.price,
    });

    res.status(201).json({ offerId });
  } catch (err: any) {
    console.error('Create offer error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to create offer' });
  }
});

// GET /offers — List offers for the current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const role = (req.query.role as string) === 'seller' ? 'seller' : 'buyer';
    const offers = await getOffersByUser(user.uid, role);
    res.json({ offers });
  } catch (err: any) {
    console.error('List offers error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to list offers' });
  }
});

// GET /offers/listing/:listingId — Get all offers for a listing (seller only)
router.get('/listing/:listingId', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const listingId = getParam(req, 'listingId');
    const offers = await getOffersByListing(listingId);

    // Verify caller is the seller
    if (offers.length > 0 && (offers[0] as any).sellerId !== user.uid) {
      res.status(403).json({ error: 'forbidden', message: 'Not authorized to view these offers' });
      return;
    }

    res.json({ offers });
  } catch (err: any) {
    console.error('Get listing offers error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to get offers' });
  }
});

// GET /offers/listing/:listingId/mine — Get the buyer's own offer for a listing
router.get('/listing/:listingId/mine', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const listingId = getParam(req, 'listingId');
    const offer = await getBuyerOfferForListing(listingId, user.uid);
    res.json({ offer: offer || null });
  } catch (err: any) {
    console.error('Get my offer error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to get offer' });
  }
});

// POST /offers/:id/accept — Seller accepts an offer
router.post('/:id/accept', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const offerId = getParam(req, 'id');
    const { declinedOfferIds } = await acceptOffer(offerId, user.uid);

    // Fetch the accepted offer to send notification
    const acceptedSnap = await db.collection('offers').doc(offerId).get();
    const acceptedOffer = acceptedSnap.data() as any;

    if (acceptedOffer) {
      sendOfferAccepted({
        listingTitle: acceptedOffer.listingTitle,
        listingId: acceptedOffer.listingId,
        amount: acceptedOffer.amount,
        buyerId: acceptedOffer.buyerId,
      });
    }

    // Fire-and-forget: notify each declined buyer
    for (const declinedId of declinedOfferIds) {
      const declinedSnap = await db.collection('offers').doc(declinedId).get();
      const declinedOffer = declinedSnap.data() as any;
      if (declinedOffer) {
        sendOfferDeclined({
          listingTitle: declinedOffer.listingTitle,
          buyerId: declinedOffer.buyerId,
        });
      }
    }

    res.json({ message: 'Offer accepted' });
  } catch (err: any) {
    console.error('Accept offer error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to accept offer' });
  }
});

// POST /offers/:id/decline — Seller declines an offer
router.post('/:id/decline', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const offerId = getParam(req, 'id');
    await declineOffer(offerId, user.uid);

    // Fetch the declined offer to send notification
    const declinedSnap = await db.collection('offers').doc(offerId).get();
    const declinedOffer = declinedSnap.data() as any;

    if (declinedOffer) {
      sendOfferDeclined({
        listingTitle: declinedOffer.listingTitle,
        buyerId: declinedOffer.buyerId,
      });
    }

    res.json({ message: 'Offer declined' });
  } catch (err: any) {
    console.error('Decline offer error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to decline offer' });
  }
});

// POST /offers/:id/withdraw — Buyer withdraws their offer
router.post('/:id/withdraw', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const offerId = getParam(req, 'id');
    await withdrawOffer(offerId, user.uid);
    res.json({ message: 'Offer withdrawn' });
  } catch (err: any) {
    console.error('Withdraw offer error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message || 'Failed to withdraw offer' });
  }
});

export default router;
