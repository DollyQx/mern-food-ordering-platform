import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getUserProfile, updateUserAddress } from '../controllers/userController';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/address', protect, updateUserAddress);

export default router;
