'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketContextType {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Strip '/api' from the URL if it exists, as Socket.io connects to root
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '');

        // Force WebSocket transport to avoid polling issues/connection drops
        const newSocket = io(baseUrl, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Socket Connected:', newSocket.id);

            // Join rooms
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role === 'admin') {
                    newSocket.emit('join_admin_room');
                    newSocket.emit('join_user_room', user._id); // Join own room too
                } else {
                    newSocket.emit('join_user_room', user._id);
                }
            }
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ Socket Connection Error:', err);
        });

        // Listen for Order Updates (User)
        // Fixed event name to match server emission: 'orderStatusUpdated'
        newSocket.on('orderStatusUpdated', (data) => {
            console.log('Order Updated Event Received:', data);
            toast.info(`Order Status: ${data.status}`, {
                description: `Order #${data.orderId.substring(data.orderId.length - 6)} is now ${data.status}`
            });
        });

        // Listen for New Orders (Admin)
        // Fixed event name to match server emission: 'newOrder'
        newSocket.on('newOrder', (data) => {
            console.log('New Order Event Received:', data);
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio play failed', e));

            toast.success('New Order Received!', {
                description: `Order #${data._id.substring(data._id.length - 6)} for ₹${data.totalAmount}`,
                duration: 5000,
                action: {
                    label: 'View',
                    onClick: () => window.location.href = '/admin/orders'
                }
            });
        });

        // Cleanup
        return () => {
            newSocket.off('connect');
            newSocket.off('connect_error');
            newSocket.off('orderStatusUpdated');
            newSocket.off('newOrder');
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
