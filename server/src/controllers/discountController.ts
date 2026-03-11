import { Request, Response } from 'express';
import { Coupon } from '../models/Coupon';

// @desc    Validate and apply a coupon
// @route   POST /api/discounts/apply
// @access  Private
export const applyCoupon = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, orderAmount } = req.body;

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true,
            expiryDate: { $gt: new Date() }
        });

        if (!coupon) {
            res.status(404).json({ message: 'Invalid or expired coupon code' });
            return;
        }

        if (coupon.usageLimit <= coupon.usedCount) {
            res.status(400).json({ message: 'Coupon usage limit reached' });
            return;
        }

        if (orderAmount < coupon.minOrderAmount) {
            res.status(400).json({ message: `Minimum order amount of ₹${coupon.minOrderAmount} required` });
            return;
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (orderAmount * coupon.value) / 100;
            if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
            }
        } else {
            discount = coupon.value;
        }

        if (discount > orderAmount) {
            discount = orderAmount;
        }

        res.json({
            success: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.value,
            calculatedDiscount: Math.round(discount)
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/discounts/coupons
// @access  Private/Admin
export const getCoupons = async (req: Request, res: Response) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a coupon (Admin)
// @route   POST /api/discounts/coupons
// @access  Private/Admin
export const createCoupon = async (req: Request, res: Response) => {
    try {
        const { code, discountType, value, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit } = req.body;

        const coupon = await Coupon.create({
            code,
            discountType,
            value,
            minOrderAmount,
            maxDiscountAmount,
            expiryDate,
            usageLimit
        });

        res.status(201).json(coupon);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active coupons (Public)
// @route   GET /api/discounts/active
// @access  Public
export const getActiveCoupons = async (req: Request, res: Response) => {
    try {
        const activeCoupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gt: new Date() }
        }).sort({ createdAt: -1 });
        
        res.json(activeCoupons);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
