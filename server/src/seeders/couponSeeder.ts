import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Coupon } from '../models/Coupon';

dotenv.config();

const seedCoupons = async () => {
    try {
        console.log("Connecting to DB at 127.0.0.1...");
        const uri = 'mongodb://127.0.0.1:27017/zomoggy';
        await mongoose.connect(uri);
        console.log('MongoDB Connected');

        const coupons = [
            {
                code: 'WELCOME50',
                discountType: 'percentage',
                value: 50,
                minOrderAmount: 200,
                maxDiscountAmount: 150,
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
                isActive: true,
                usageLimit: 1000
            },
            {
                code: 'FLAT100',
                discountType: 'fixed',
                value: 100,
                minOrderAmount: 500,
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                isActive: true,
                usageLimit: 500
            }
        ];

        for (const c of coupons) {
            const exists = await Coupon.findOne({ code: c.code });
            if (!exists) {
                // @ts-ignore - Schema matches but TS might complain strictly about string literals
                await Coupon.create(c);
                console.log(`Created Coupon: ${c.code}`);
            } else {
                console.log(`Coupon Exists: ${c.code}`);
            }
        }

        console.log('Coupon Seeding Completed');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedCoupons();
