import { Router } from 'express';
import { getDashboardStats, updateOrderStatus, getSettings, updateSettings, getAllOrders } from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';

const router = Router();

router.get('/stats', protect, admin, getDashboardStats);
router.put('/order/:id', protect, admin, updateOrderStatus);
router.get('/orders', protect, admin, getAllOrders);

router.get('/settings', protect, admin, getSettings);
router.put('/settings', protect, admin, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), updateSettings);

export default router;
