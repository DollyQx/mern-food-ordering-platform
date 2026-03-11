import { Router } from 'express';
import { addAddress, getAddresses, checkServiceability, createDeliveryZone } from '../controllers/locationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/address', protect, addAddress);
router.get('/address', protect, getAddresses);
router.post('/check', checkServiceability);
router.post('/zones', protect, createDeliveryZone); // TODO: Add admin check

export default router;
