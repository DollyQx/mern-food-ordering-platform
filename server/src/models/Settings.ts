import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    siteName: string;
    deliveryFee: number;
    minOrderValue: number;
    taxRate: number; // in percentage
    currency: string;
    freeDeliveryThreshold: number;
    freeGiftThreshold: number;
    logo?: string;
    banner?: string;
}

const SettingsSchema: Schema = new Schema({
    siteName: { type: String, default: 'Zomoggy' },
    deliveryFee: { type: Number, default: 40 },
    minOrderValue: { type: Number, default: 199 },
    taxRate: { type: Number, default: 5 },
    currency: { type: String, default: 'INR' },
    freeDeliveryThreshold: { type: Number, default: 300 },
    freeGiftThreshold: { type: Number, default: 400 },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
}, { timestamps: true });

export const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
