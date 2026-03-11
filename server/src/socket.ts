import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (res: HttpServer) => {
    io = new Server(res, {
        cors: {
            origin: "*", // Allow all for debugging
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected with socket ID:', socket.id);

        socket.on('join_admin_room', () => {
            console.log(`Socket ${socket.id} joining admin_notifications`);
            socket.join('admin_notifications');
        });

        socket.on('join_user_room', (userId) => {
            if (userId) {
                console.log(`Socket ${socket.id} joining user_${userId}`);
                socket.join(`user_${userId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
