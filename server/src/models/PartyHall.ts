import mongoose, { Schema, Document } from 'mongoose';

export interface IPartyHall extends Document {
    name: string;
    description: string;
    capacityMin: number;
    capacityMax: number;
    pricePerEvent: number;
    pricePerPlate: number;
    amenities: string[];
    images: string[];
    availability: {
        date: Date;
        timeSlot: string; // "Day" | "Night" | "Full Day"
        isBooked: boolean;
        bookingId?: mongoose.Schema.Types.ObjectId;
    }[];
}

const PartyHallSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    capacityMin: { type: Number, required: true },
    capacityMax: { type: Number, required: true },
    pricePerEvent: { type: Number, required: true }, // Base rental
    pricePerPlate: { type: Number, default: 0 }, // Optional catering
    amenities: [{ type: String }],
    images: [{ type: String }],
    availability: [
        {
            date: { type: Date, required: true },
            timeSlot: { type: String, required: true },
            isBooked: { type: Boolean, default: false },
            bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartyBooking' }
        }
    ]
}, { timestamps: true });

export const PartyHall = mongoose.model<IPartyHall>('PartyHall', PartyHallSchema);
