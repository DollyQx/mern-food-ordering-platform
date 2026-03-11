import express from 'express';
import { subscribeToNotifications, saveFcmToken } from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/subscribe', protect, subscribeToNotifications);
router.post('/fcm-token', protect, saveFcmToken);

export default router;
