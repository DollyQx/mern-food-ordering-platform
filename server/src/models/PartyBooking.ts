import mongoose, { Schema, Document } from 'mongoose';

export interface IPartyBooking extends Document {
    user: mongoose.Schema.Types.ObjectId;
    hall: mongoose.Schema.Types.ObjectId;
    eventType: string;
    date: Date;
    timeSlot: string; // "Day" (11-4), "Night" (6-11), "Full Day"
    guestCount: number;
    cateringRequired: boolean;
    specialRequirements?: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
    totalAmount: number;
    tokenAmountPaid: number;
    paymentStatus: 'Pending' | 'Partially Paid' | 'Paid' | 'Failed';
    paymentId?: string;
    contactInfo: {
        name: string;
        phone: string;
    };
}

const PartyBookingSchema: Schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hall: { type: mongoose.Schema.Types.ObjectId, ref: 'PartyHall', required: true },
    eventType: { type: String, required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    guestCount: { type: Number, required: true },
    cateringRequired: { type: Boolean, default: false },
    specialRequirements: { type: String },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
        default: 'Pending'
    },
    totalAmount: { type: Number, required: true },
    tokenAmountPaid: { type: Number, default: 0 },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partially Paid', 'Paid', 'Failed'],
        default: 'Pending'
    },
    paymentId: { type: String },
    contactInfo: {
        name: { type: String, required: true },
        phone: { type: String, required: true }
    }
}, { timestamps: true });

export const PartyBooking = mongoose.model<IPartyBooking>('PartyBooking', PartyBookingSchema);
