import { Router, Request, Response } from 'express';
import { requireAuth, requireVerifiedEmail, requireMinAge, AuthenticatedRequest } from '../middleware/auth';
import { MIN_WHEEL_AGE } from '@scentresort/shared';
import { getParam } from '../types';
import {
  getActiveWheel,
  initiateSpin,
  executeSpin,
  executeFreeSpin,
  claimPrize,
  getRecentWins,
  getUserSpins,
} from '../services/wheel.service';

const router = Router();

// GET /wheel — Get active wheel config (public)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const wheel = await getActiveWheel();
    if (!wheel) {
      res.status(404).json({ error: 'not_found', message: 'No active wheel' });
      return;
    }
    res.json({ wheel });
  } catch (err: any) {
    console.error('Get wheel error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get wheel' });
  }
});

// GET /wheel/spins/recent — Public recent wins feed
router.get('/spins/recent', async (_req: Request, res: Response) => {
  try {
    const spins = await getRecentWins();
    res.json({ spins });
  } catch (err: any) {
    console.error('Get recent wins error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get recent wins' });
  }
});

// POST /wheel/spin — Initiate paid spin (creates PaymentIntent)
router.post('/spin', requireAuth, requireVerifiedEmail, requireMinAge(MIN_WHEEL_AGE), async (req: Request, res: Response) => {
  try {
    const { uid, displayName } = (req as AuthenticatedRequest).user;
    const { wheelId, clientSeed } = req.body;

    if (!wheelId || !clientSeed) {
      res.status(400).json({ error: 'bad_request', message: 'wheelId and clientSeed required' });
      return;
    }

    const result = await initiateSpin(uid, displayName, wheelId, clientSeed);
    res.json(result);
  } catch (err: any) {
    console.error('Initiate spin error:', err);
    res.status(400).json({ error: 'spin_error', message: err.message });
  }
});

// POST /wheel/spin/:id/confirm — Confirm spin after payment (called by frontend after Stripe confirms)
router.post('/spin/:id/confirm', requireAuth, requireMinAge(MIN_WHEEL_AGE), async (req: Request, res: Response) => {
  try {
    const spinId = getParam(req, 'id');
    const result = await executeSpin(spinId);
    res.json(result);
  } catch (err: any) {
    console.error('Confirm spin error:', err);
    res.status(400).json({ error: 'spin_error', message: err.message });
  }
});

// POST /wheel/spin/free — Daily free spin
router.post('/spin/free', requireAuth, requireVerifiedEmail, requireMinAge(MIN_WHEEL_AGE), async (req: Request, res: Response) => {
  try {
    const { uid, displayName } = (req as AuthenticatedRequest).user;
    const { wheelId, clientSeed } = req.body;

    if (!wheelId || !clientSeed) {
      res.status(400).json({ error: 'bad_request', message: 'wheelId and clientSeed required' });
      return;
    }

    const result = await executeFreeSpin(uid, displayName, wheelId, clientSeed);
    res.json(result);
  } catch (err: any) {
    console.error('Free spin error:', err);
    res.status(400).json({ error: 'spin_error', message: err.message });
  }
});

// GET /wheel/spins — User's spin history
router.get('/spins', requireAuth, async (req: Request, res: Response) => {
  try {
    const { uid } = (req as AuthenticatedRequest).user;
    const spins = await getUserSpins(uid);
    res.json({ spins });
  } catch (err: any) {
    console.error('Get user spins error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get spin history' });
  }
});

// POST /wheel/spin/:id/claim — Claim prize (ship or take credit)
router.post('/spin/:id/claim', requireAuth, requireMinAge(MIN_WHEEL_AGE), async (req: Request, res: Response) => {
  try {
    const { uid } = (req as AuthenticatedRequest).user;
    const spinId = getParam(req, 'id');
    const { fulfillmentMethod, shippingAddress } = req.body;

    if (!fulfillmentMethod || !['ship', 'credit'].includes(fulfillmentMethod)) {
      res.status(400).json({ error: 'bad_request', message: 'fulfillmentMethod must be "ship" or "credit"' });
      return;
    }

    if (fulfillmentMethod === 'ship' && !shippingAddress) {
      res.status(400).json({ error: 'bad_request', message: 'Shipping address required for shipping' });
      return;
    }

    const result = await claimPrize(spinId, uid, fulfillmentMethod, shippingAddress);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Claim prize error:', err);
    res.status(400).json({ error: 'claim_error', message: err.message });
  }
});

export default router;
