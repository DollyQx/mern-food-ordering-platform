import mongoose from 'mongoose';
import { Category } from './models/Menu';
import dotenv from 'dotenv';
import path from 'path';

// Adjust path to .env file if running from src or root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
    try {
        console.log('Connecting to DB at:', process.env.MONGO_URI || 'mongodb://localhost:27017/zomoggy');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zomoggy');
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error connecting to DB:', error);
        process.exit(1);
    }
};

const debugCategories = async () => {
    await connectDB();

    console.log('Fetching all categories...');
    const categories = await Category.find({});

    console.log(`Found ${categories.length} categories.`);
    categories.forEach(cat => {
        console.log(`
--------------------------------------------------
ID: ${cat._id}
Name: ${cat.name}
Active: ${cat.isActive}
Available (Switch): ${cat.isAvailable}
Availability (Schedule): ${JSON.stringify(cat.availability)}
SubCategories: ${JSON.stringify(cat.subCategories)}
--------------------------------------------------
        `);
    });

    process.exit(0);
};

debugCategories();
