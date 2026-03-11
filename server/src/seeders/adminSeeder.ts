import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';

dotenv.config();

const seedAdmin = async () => {
    try {
        console.log("Connecting to DB at 127.0.0.1...");
        // On Windows sometimes 'localhost' resolves to IPv6 ::1 which Mongo might not be listening on
        const uri = 'mongodb://127.0.0.1:27017/zomoggy';
        await mongoose.connect(uri);
        console.log('MongoDB Connected');

        const adminExists = await User.findOne({ email: 'admin@zomoggy.com' });

        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await User.create({
            name: 'Super Admin',
            email: 'admin@zomoggy.com',
            password: hashedPassword,
            role: 'admin',
            phone: '9999999999'
        });

        console.log('Admin User Created: admin@zomoggy.com / admin123');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();
