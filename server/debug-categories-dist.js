const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models might be in dist/models/Menu.js
const { Category } = require('./dist/models/Menu');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = async () => {
    // Force 127.0.0.1 for local dev to avoid IPv6 issues
    let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zomoggy';
    if (uri.includes('localhost')) {
        uri = uri.replace('localhost', '127.0.0.1');
    }

    try {
        console.log('Connecting to:', uri);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error connecting to DB:', error);
        process.exit(1);
    }
};

const debugCategories = async () => {
    await connectDB();

    console.log('Fetching all categories...');
    try {
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
    } catch (e) {
        console.error("Error fetching categories:", e);
    }

    process.exit(0);
};

debugCategories();
