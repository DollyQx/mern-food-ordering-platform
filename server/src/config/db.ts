import mongoose from 'mongoose';

// Connection interface extension to cache logic
let cachedConn: typeof mongoose | null = null;
let cachedPromise: Promise<typeof mongoose> | null = null;

const connectDB = async () => {
    if (cachedConn) {
        return cachedConn;
    }

    if (!cachedPromise) {
        const opts = {
            maxPoolSize: 50,
            minPoolSize: 10,
            socketTimeoutMS: 60000,
            serverSelectionTimeoutMS: 30000,
            family: 4,
            bufferCommands: true, // Ensure operations wait for connection
        };

        cachedPromise = mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zomoggy', opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cachedConn = await cachedPromise;
        console.log(`MongoDB Connected: ${cachedConn.connection.host}`);

        // Listeners - Only attach once if possible, but mongoose handles duplicates well or we can check
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
            // Do NOT exit process here. Let it try to reconnect.
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Mongoose will attempt to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        return cachedConn;
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        // Only exit if initial connection fails completely
        process.exit(1);
    }
};

export default connectDB;
