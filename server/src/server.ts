import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/db';

import http from 'http';
import { initSocket } from './socket';

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
    try {
        await connectDB();

        const httpServer = http.createServer(app);
        initSocket(httpServer);

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Global Error Handlers to prevent crash
process.on('unhandledRejection', (err: any) => {
    console.error('Unhandled Rejection:', err.message);
    // Don't exit immediately, log it. Mongoose might reconnect.
});

process.on('uncaughtException', (err: any) => {
    console.error('Uncaught Exception:', err.message);
    // For critical errors you might restart, but for now log to keep traffic flowing if possible
});
