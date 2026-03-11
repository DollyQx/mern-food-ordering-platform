import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category, MenuItem } from '../models/Menu';

dotenv.config();

const seedMenu = async () => {
    try {
        console.log("Connecting to DB at 127.0.0.1...");
        const uri = 'mongodb://127.0.0.1:27017/zomoggy';
        await mongoose.connect(uri);
        console.log('MongoDB Connected');

        // Clear existing menu (optional, but good for clean state if requested "default")
        // await MenuItem.deleteMany({});
        // await Category.deleteMany({});

        // Check if categories exist or create them
        let snacksCat = await Category.findOne({ name: 'Snacks' });
        if (!snacksCat) {
            snacksCat = await Category.create({ name: 'Snacks', isActive: true });
        }

        let mainCourseCat = await Category.findOne({ name: 'Main Course' });
        if (!mainCourseCat) {
            mainCourseCat = await Category.create({ name: 'Main Course', isActive: true });
        }

        let dessertsCat = await Category.findOne({ name: 'Desserts' });
        if (!dessertsCat) {
            dessertsCat = await Category.create({ name: 'Desserts', isActive: true });
        }

        const items = [
            {
                name: 'Samosa',
                description: 'Crispy fried pastry with savory potato filling.',
                price: 20,
                category: snacksCat._id,
                isVeg: true,
                isAvailable: true,
                image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'
            },
            {
                name: 'Chhole Bhature',
                description: 'Spicy chickpeas served with fried bread.',
                price: 150,
                category: mainCourseCat._id,
                isVeg: true,
                isAvailable: true,
                image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&q=80'
            },
            {
                name: 'Chocolate Cake',
                description: 'Rich and moist chocolate cake slice.',
                price: 120,
                category: dessertsCat._id,
                isVeg: false, // Contains egg usually, or mark true if eggless. Assuming false for variety.
                isAvailable: true,
                image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80'
            }
        ];

        for (const item of items) {
            const exists = await MenuItem.findOne({ name: item.name });
            if (!exists) {
                await MenuItem.create(item);
                console.log(`Created: ${item.name}`);
            } else {
                console.log(`Skipped (Exists): ${item.name}`);
            }
        }

        console.log('Menu Seeding Completed');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedMenu();
