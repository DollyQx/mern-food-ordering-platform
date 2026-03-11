import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number; // Percentage value (0-100) or Fixed Amount
    minOrderAmount: number;
    maxDiscountAmount: number;
    expiryDate: Date;
    isActive: boolean;
    usageLimit: number;
    usedCount: number;
}

const CouponSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number }, // Only for percentage
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 }
}, { timestamps: true });

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
