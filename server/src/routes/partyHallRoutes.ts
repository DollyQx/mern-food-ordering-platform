import { Router } from 'express';
import { getHallDetails, checkAvailability, bookHall, verifyBookingPayment } from '../controllers/partyHallController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getHallDetails);
router.post('/availability', checkAvailability);
router.post('/book', protect, bookHall);
router.post('/verify-payment', protect, verifyBookingPayment);

export default router;
