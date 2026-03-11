import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role: 'user' | 'admin' | 'rider';
    walletBalance: number;
    address?: {
        fullAddress: string;
        apartment: string;
        street: string;
        location: {
            lat: number;
            lng: number;
        };
    };
    pushSubscription?: any;
    fcmToken?: string; // Android FCM Token
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String },
        password: { type: String },
        role: { type: String, enum: ['user', 'admin', 'rider'], default: 'user' },
        walletBalance: { type: Number, default: 0 },
        address: {
            fullAddress: { type: String },
            apartment: { type: String },
            street: { type: String },
            location: {
                lat: { type: Number },
                lng: { type: Number }
            }
        },
        pushSubscription: { type: Schema.Types.Mixed }, // Store Web Push Subscription
        fcmToken: { type: String }, // Store Android FCM Token
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
