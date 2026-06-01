import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getUserActiveCoupons, getUserCouponHistory } from '../services/coupon.service';

const router = Router();
router.use(requireAuth);

// GET /coupons — User's active coupons
router.get('/', async (req: Request, res: Response) => {
  try {
    const { uid } = (req as AuthenticatedRequest).user;
    const coupons = await getUserActiveCoupons(uid);
    res.json({ coupons });
  } catch (err: any) {
    console.error('Get coupons error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get coupons' });
  }
});

// GET /coupons/history — All coupons including used
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { uid } = (req as AuthenticatedRequest).user;
    const coupons = await getUserCouponHistory(uid);
    res.json({ coupons });
  } catch (err: any) {
    console.error('Get coupon history error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to get coupon history' });
  }
});

export default router;
