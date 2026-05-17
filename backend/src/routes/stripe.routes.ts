import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  createConnectAccount,
  createAccountLink,
  syncAccountStatus,
  createDashboardLink,
} from '../services/stripe.service';

const router = Router();
router.use(requireAuth);

// POST /stripe/connect/onboard — Start or resume Stripe Connect onboarding
router.post('/connect/onboard', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { returnUrl, refreshUrl } = req.body;

    if (!returnUrl || !refreshUrl) {
      res.status(400).json({ error: 'bad_request', message: 'returnUrl and refreshUrl are required' });
      return;
    }

    let accountId = user.stripeAccountId;

    // Create account if user doesn't have one yet
    if (!accountId) {
      const account = await createConnectAccount(user.uid, user.email);
      accountId = account.id;
    }

    // Generate onboarding link
    const accountLink = await createAccountLink(accountId, returnUrl, refreshUrl);

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error('Stripe onboard error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to start onboarding' });
  }
});

// GET /stripe/connect/status — Get current Stripe account status
router.get('/connect/status', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user.stripeAccountId) {
      res.json({
        connected: false,
        stripeAccountStatus: 'pending',
        stripeOnboardingComplete: false,
      });
      return;
    }

    // Sync latest status from Stripe
    const status = await syncAccountStatus(user.uid, user.stripeAccountId);

    res.json({
      connected: true,
      ...status,
    });
  } catch (err) {
    console.error('Stripe status error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get account status' });
  }
});

// GET /stripe/connect/dashboard — Get Stripe Express Dashboard login link
router.get('/connect/dashboard', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user.stripeAccountId) {
      res.status(400).json({ error: 'bad_request', message: 'No Stripe account connected' });
      return;
    }

    const loginLink = await createDashboardLink(user.stripeAccountId);
    res.json({ url: loginLink.url });
  } catch (err) {
    console.error('Stripe dashboard error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get dashboard link' });
  }
});

// POST /stripe/connect/refresh — Generate new onboarding link if interrupted
router.post('/connect/refresh', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { returnUrl, refreshUrl } = req.body;

    if (!user.stripeAccountId) {
      res.status(400).json({ error: 'bad_request', message: 'No Stripe account found. Start onboarding first.' });
      return;
    }

    const accountLink = await createAccountLink(user.stripeAccountId, returnUrl, refreshUrl);
    res.json({ url: accountLink.url });
  } catch (err) {
    console.error('Stripe refresh error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to refresh onboarding link' });
  }
});

export default router;
