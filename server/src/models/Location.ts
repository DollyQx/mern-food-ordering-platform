import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress extends Document {
    user: mongoose.Schema.Types.ObjectId;
    label: string; // e.g. Home, Work
    addressLine: string;
    city: string;
    pincode: string;
    location: {
        type: 'Point';
        coordinates: number[]; // [longitude, latitude]
    };
}

const AddressSchema: Schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, default: 'Home' },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true },
    },
});

// Create 2dsphere index for geospatial queries
AddressSchema.index({ location: '2dsphere' });

export const Address = mongoose.model<IAddress>('Address', AddressSchema);


export interface IDeliveryZone extends Document {
    name: string;
    area: {
        type: 'Polygon';
        coordinates: number[][][];
    };
    isActive: boolean;
}

const DeliveryZoneSchema: Schema = new Schema({
    name: { type: String, required: true },
    area: {
        type: { type: String, enum: ['Polygon'], required: true },
        coordinates: { type: [[[Number]]], required: true },
    },
    isActive: { type: Boolean, default: true },
});

DeliveryZoneSchema.index({ area: '2dsphere' });

export const DeliveryZone = mongoose.model<IDeliveryZone>('DeliveryZone', DeliveryZoneSchema);
