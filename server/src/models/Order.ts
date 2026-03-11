import mongoose, { Schema, Document } from 'mongoose';

export interface IDistinctItem {
    menuItem: mongoose.Schema.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    variant?: { name: string; price: number };
}

export interface ICart extends Document {
    user: mongoose.Schema.Types.ObjectId;
    items: IDistinctItem[];
    totalAmount: number;
}

const CartSchema: Schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
        {
            menuItem: { type: mongoose.Schema.Types.Mixed, required: true },
            name: { type: String }, // redundant but helper
            quantity: { type: Number, required: true, default: 1 },
            price: { type: Number, required: true },
            variant: {
                name: { type: String },
                price: { type: Number }
            },
        },
    ],
    totalAmount: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export const Cart = mongoose.model<ICart>('Cart', CartSchema);


export interface IOrder extends Document {
    user: mongoose.Schema.Types.ObjectId;
    items: IDistinctItem[];
    totalAmount: number;
    status: 'Placed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
    paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
    paymentDetails?: {
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
    };
    razorpayOrderId?: string;
    targetPaymentStatus?: 'Pending' | 'Paid';
    paymentMethod: 'COD' | 'Online';
    transactionId?: string;
    address: {
        fullAddress: string;
        pincode: string;
        location: { lat: number; lng: number; };
    };
    couponApplied?: string;
    discountAmount: number;
    pointsUsed?: number;
    refundId?: string;
    refundStatus?: string;
    deliveryInfo?: {
        deliveryBoyName?: string;
        contactNumber?: string;
    };
    cancellationReason?: string;
    refundAmount?: number;
    isRefundable?: boolean;
}

const OrderSchema: Schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            menuItem: { type: mongoose.Schema.Types.Mixed, required: true },
            name: { type: String },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            variant: {
                name: { type: String },
                price: { type: Number }
            },
        }
    ],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Placed'
    },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['COD', 'Online'], default: 'Online' },
    transactionId: { type: String },
    address: {
        fullAddress: { type: String, required: true },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        },
        pincode: { type: String, required: true }
    },
    deliveryInfo: {
        deliveryBoyName: { type: String },
        contactNumber: { type: String }
    },
    couponApplied: { type: String },
    discountAmount: { type: Number, default: 0 },
    pointsUsed: { type: Number, default: 0 }, // Track Zomo Points redeemed
    refundId: { type: String },
    refundStatus: { type: String },
    paymentDetails: {
        razorpay_payment_id: { type: String },
        razorpay_order_id: { type: String },
        razorpay_signature: { type: String }
    },
    razorpayOrderId: { type: String, index: true }, // For searching by Rz Order ID
    cancellationReason: { type: String },
    refundAmount: { type: Number, default: 0 },
    isRefundable: { type: Boolean, default: true },
}, { timestamps: true });

// Indexes for performance
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
