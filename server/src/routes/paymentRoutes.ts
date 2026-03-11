import { Router } from 'express';
import { createPaymentOrder, handleWebhook } from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/webhook', handleWebhook);

export default router;
