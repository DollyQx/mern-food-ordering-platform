import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory, getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController';
// Note: getSettings is usually in adminController, but for public access it's better to export it or duplicate logic. 
// However, I see I imported it from menuController above which is wrong, it is in adminController. 
// Let me correct the import or check where I should import it from.
// Actually, I can import { getSettings } from '../controllers/adminController'.

import { getDashboardStats, updateOrderStatus, updateSettings, getAllOrders } from '../controllers/adminController';
import { getSettings } from '../controllers/adminController';
import upload from '../middleware/uploadMiddleware';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/config', getSettings); // Public config endpoint

router.get('/categories', getCategories);
router.post('/categories', protect, upload.single('image'), createCategory);
router.put('/categories/:id', protect, upload.single('image'), updateCategory);
router.delete('/categories/:id', protect, deleteCategory);

router.get('/items', getMenuItems);
router.post('/items', protect, upload.single('image'), createMenuItem);
router.put('/items/:id', protect, upload.single('image'), updateMenuItem);
router.delete('/items/:id', protect, deleteMenuItem);

export default router;
