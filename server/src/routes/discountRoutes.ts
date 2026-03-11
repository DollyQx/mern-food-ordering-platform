import { Router } from 'express';
import { applyCoupon, getCoupons, createCoupon, getActiveCoupons } from '../controllers/discountController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

router.post('/apply', protect, applyCoupon);
router.get('/coupons', protect, admin, getCoupons);
router.post('/coupons', protect, admin, createCoupon);
router.get('/active', getActiveCoupons);

export default router;
