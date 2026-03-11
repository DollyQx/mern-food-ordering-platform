import { Request, Response } from 'express';
import User from '../models/User';
import { Order } from '../models/Order';
import { Settings } from '../models/Settings';
import { sendWhatsAppNotification } from '../services/notificationService';
import { getIO } from '../socket';
import { razorpay } from './paymentController';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Optimization: Use Aggregation for revenue calculation
        const revenueResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);

        res.json({
            totalUsers,
            totalOrders,
            totalRevenue,
            recentOrders
        });
    } catch (error: any) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/admin/order/:id
// @access  Private/Admin
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id).populate('user', 'phone name');

        if (order) {
            // Safeguards: Prevent invalid state transitions
            if (order.status === 'Delivered') {
                res.status(400).json({ message: 'Cannot change status of a Delivered order' });
                return;
            }
            if (order.status === 'Cancelled') {
                res.status(400).json({ message: 'Cannot change status of a Cancelled order' });
                return;
            }

            // Store previous status to prevent double crediting
            const previousStatus = order.status;
            order.status = status;

            // Credit Zomo Points if delivered and not previously delivered
            if (status === 'Delivered') {
                const pointsToCredit = Math.floor(order.totalAmount * 0.05); // 5%
                console.log(`[ZomoPoints] Order ${order._id} Delivered. Crediting ${pointsToCredit} points.`);
                if (pointsToCredit > 0) {
                    try {
                        const userId = (order.user as any)._id || order.user;
                        await User.findByIdAndUpdate(userId, {
                            $inc: { walletBalance: pointsToCredit }
                        });
                        console.log(`[ZomoPoints] Credited ${pointsToCredit} points to user ${userId}`);
                    } catch (err) {
                        console.error("Failed to credit points", err);
                    }
                }
            }

            if (req.body.deliveryInfo) {
                order.deliveryInfo = req.body.deliveryInfo;
            }

            // Handle Cancellation: Refund Money & Points
            if (status === 'Cancelled') {
                // 1. Refund Zomo Points
                const pointsToRefund = order.pointsUsed || 0;
                if (pointsToRefund > 0) {
                    try {
                        const userId = (order.user as any)._id || order.user;
                        await User.findByIdAndUpdate(userId, {
                            $inc: { walletBalance: pointsToRefund }
                        });
                        console.log(`[ZomoPoints] Refunded ${pointsToRefund} points to user ${userId} for Order ${order._id}`);
                    } catch (err) {
                        console.error("Failed to refund points", err);
                    }
                }

                // 2. Refund Online Payment (Razorpay) - DISABLED per user request
                // Checks if eligible for refund but DOES NOT initiate it.
                if (order.paymentMethod === 'Online' && order.paymentStatus === 'Paid' && order.transactionId && !order.refundId) {
                    console.log(`[Order Cancelled] Order ${order._id} cancelled. Payment ${order.transactionId} remains CAPTURED. Please refund MANUALLY via Dashboard.`);
                }
            }

            const updatedOrder = await order.save();

            // Send notification
            try {
                if (order.user) {
                    const user: any = order.user;
                    if (user.phone) {
                        const pointsMsg = (status === 'Delivered')
                            ? ` You have earned ${Math.floor(order.totalAmount * 0.05)} Zomo Points!`
                            : '';
                        await sendWhatsAppNotification(user.phone, `Your order status is now: ${status}.${pointsMsg}`);
                    }
                }
            } catch (notifyError) {
                console.error("Notification failed", notifyError);
                // Continue execution
            }

            // Real-time Update to User
            try {
                const io = getIO();
                // Assuming user has _id populated or available.
                const userId = (order.user as any)._id || order.user;
                io.to(`user_${userId}`).emit('orderStatusUpdated', {
                    orderId: order._id,
                    status: status,
                    deliveryInfo: order.deliveryInfo
                });
            } catch (socketError) {
                console.error("Socket emit failed", socketError);
                // Continue execution
            }

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error: any) {
        console.error("Update Order Error:", error);
        res.status(500).json({ message: error.message || "Server Error" });
    }
};


// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getSettings = async (req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateSettings = async (req: Request, res: Response) => {
    try {
        const { siteName, deliveryFee, minOrderValue, taxRate, freeDeliveryThreshold, freeGiftThreshold } = req.body;

        let settings = await Settings.findOne();
        if (settings) {
            settings.siteName = siteName || settings.siteName;
            settings.deliveryFee = deliveryFee !== undefined ? deliveryFee : settings.deliveryFee;
            settings.minOrderValue = minOrderValue !== undefined ? minOrderValue : settings.minOrderValue;
            settings.taxRate = taxRate !== undefined ? taxRate : settings.taxRate;
            settings.freeDeliveryThreshold = freeDeliveryThreshold !== undefined ? freeDeliveryThreshold : settings.freeDeliveryThreshold;
            settings.freeGiftThreshold = freeGiftThreshold !== undefined ? freeGiftThreshold : settings.freeGiftThreshold;

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            if (files?.logo) settings.logo = files.logo[0].path;
            if (files?.banner) settings.banner = files.banner[0].path;

            const updatedSettings = await settings.save();
            res.json(updatedSettings);
        } else {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const newSettings = await Settings.create({
                siteName,
                deliveryFee,
                minOrderValue,
                taxRate,
                freeDeliveryThreshold,
                freeGiftThreshold,
                logo: files?.logo ? files.logo[0].path : '',
                banner: files?.banner ? files.banner[0].path : ''
            });
            res.json(newSettings);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get all orders (Paginated)
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments();
        const orders = await Order.find()
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            orders,
            page,
            pages: Math.ceil(totalOrders / limit),
            total: totalOrders
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
