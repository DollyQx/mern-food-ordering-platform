import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    image?: string;
    isActive: boolean;
    isAvailable: boolean;
    isLongDistance?: boolean;
    availablePincodes?: string[]; // Added
    availability: {
        start: string;
        end: string;
    };
    subCategories?: string[];
}

const CategorySchema: Schema = new Schema({
    name: { type: String, required: true },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    isLongDistance: { type: Boolean, default: false }, // Deprecated but kept for backward compat if needed, or remove? Plan said replace. I will keep for now to avoid breaking existing queries immediately, but focus on pincodes.
    availablePincodes: { type: [String], default: [] }, // New: Explicit allowed pincodes
    availability: {
        start: { type: String }, // e.g. "10:00"
        end: { type: String }    // e.g. "23:00"
    },
    subCategories: { type: [String], default: [] }
});

// Indexes for performance
CategorySchema.index({ isActive: 1, isAvailable: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);


export interface IMenuItem extends Document {
    name: string;
    description: string;
    price: number;
    category: mongoose.Schema.Types.ObjectId;
    subCategory?: string;
    image?: string;
    isAvailable: boolean;
    isVeg: boolean;
    variants: { name: string; price: number }[];
}

const MenuItemSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategory: { type: String },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },
    isVeg: { type: Boolean, default: true },
    variants: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true }
        }
    ],
}, { timestamps: true });

// Indexes for performance
MenuItemSchema.index({ category: 1, isAvailable: 1 });
MenuItemSchema.index({ isAvailable: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
