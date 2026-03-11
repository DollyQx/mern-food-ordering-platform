import { Router } from 'express';
import { placeOrder, getMyOrders, cancelOrder, initiateOrder, confirmOrder } from '../controllers/orderController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Maintaining backward compatibility for / path but it now points to initiateOrder logic (via placeOrder alias)
// But frontend should specificially call initiate and confirm.
router.post('/', protect, placeOrder);
router.post('/initiate', protect, initiateOrder); // New endpoint
router.post('/confirm', protect, confirmOrder);   // New endpoint

router.get('/myorders', protect, getMyOrders);
router.post('/:id/cancel', protect, cancelOrder);

export default router;
