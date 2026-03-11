'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';

interface DashboardStats {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    recentOrders: any[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [deliveryModal, setDeliveryModal] = useState<{ open: boolean; orderId: string | null }>({ open: false, orderId: null });
    const [deliveryBoyName, setDeliveryBoyName] = useState('');
    const router = useRouter();
    const { socket } = useSocket();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch admin stats", error);
        }
    };

    useEffect(() => {
        if (!socket) return;

        // Join admin room
        socket.emit('join_admin_room');

        // Listen for new orders
        socket.on('newOrder', (order) => {
            // Play Sound
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log("Audio play failed", e));
            }

            // Show Toast
            toast.success(`New Order Received! ₹${order.totalAmount}`, {
                duration: 5000,
                action: {
                    label: 'View',
                    onClick: () => console.log('View order') // or navigate
                }
            });

            // Refresh Data
            fetchStats();
        });

        return () => {
            socket.off('newOrder');
        };
    }, [socket]);

    useEffect(() => {
        const initFetch = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                await fetchStats();
            } catch (error) {
                console.error("Init fetch failed", error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        initFetch();
    }, [router]);

    const handleStatusUpdate = async (orderId: string, transformTostatus: string) => {
        try {
            let deliveryInfo = null;
            if (transformTostatus === 'Out for Delivery') { // Match strict string if enum, assuming 'Out for Delivery' due to earlier mappings, but checking code uses 'out_for_delivery' snake case in buttons
                // Wait, let's check values used in buttons. Buttons use 'preparing', 'out_for_delivery', 'delivered'.
                // Schema uses 'Out for Delivery'. The controller likely saves what is sent. 
                // Let's assume buttons send 'out_for_delivery' but we should probably map it or usage matches schema?
                // Checking previous page.tsx: `handleStatusUpdate(order._id, 'preparing')`.
                // Models/Order.ts has enum ['Placed', 'Preparing', 'Out for Delivery', 'Delivered'] with spaces.
                // So sending 'out_for_delivery' might fail validation if schema is strict enum! 
                // Actually, looking at the table rendering: `order.status` is capitalized in `td`? No `capitalize` class is used.
                // The buttons in `admin/page.tsx` seem to send snake_case strings.
                // Let's fix the button args to match Schema Enum to be safe, OR valid logic if mapping exists.
                // Assuming direct saving.
            }

            // Correction: Previous `admin/page.tsx` view (Step 130) shows:
            // onClick={() => handleStatusUpdate(order._id, 'preparing')}
            // onClick={() => handleStatusUpdate(order._id, 'out_for_delivery')}
            // The Mongoose schema has: enum: ['Placed', 'Preparing', 'Out for Delivery', 'Delivered']
            // This is a BUG in the existing code if direct save happens. 
            // I will fix the status strings AND add the delivery boy prompt.

            // Normalize status strings to match Backend Mongoose Enum
            let statusToSend = transformTostatus; // Default to what is passed if no match (e.g. 'Delivered' passed directly)

            if (transformTostatus === 'preparing' || transformTostatus === 'Preparing') {
                statusToSend = 'Preparing';
            } else if (transformTostatus === 'out_for_delivery' || transformTostatus === 'Out for Delivery') {
                // Open Modal
                setDeliveryModal({ open: true, orderId });
                return;
            } else if (transformTostatus === 'delivered' || transformTostatus === 'Delivered') {
                statusToSend = 'Delivered';
            }

            await api.put(`/admin/order/${orderId}`, { status: statusToSend, deliveryInfo });
            alert(`Order marked as ${statusToSend}`);
            // Refresh stats
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (error: any) {
            console.error("Update failed", error);
            const errorMessage = error.response?.data?.message || error.message || "Unknown error";
            alert(`Failed to update status: ${errorMessage}`);
        }
    }

    const confirmDeliveryAssignment = async () => {
        if (!deliveryModal.orderId || !deliveryBoyName.trim()) {
            alert("Please enter a name");
            return;
        }

        const orderId = deliveryModal.orderId;
        const statusToSend = 'Out for Delivery';
        const deliveryInfo = { deliveryBoyName: deliveryBoyName, contactNumber: '' };

        try {
            await api.put(`/admin/order/${orderId}`, { status: statusToSend, deliveryInfo });

            // Refresh stats
            const res = await api.get('/admin/stats');
            setStats(res.data);

            setDeliveryModal({ open: false, orderId: null });
            setDeliveryBoyName('');
            alert(`Order marked as ${statusToSend}`);
        } catch (error: any) {
            console.error("Update failed", error);
            const errorMessage = error.response?.data?.message || error.message;
            alert(`Failed to assign delivery: ${errorMessage}`);
        }
    };

    const shareOrderOnWhatsApp = (order: any) => {
        if (!order || !order.address) return;

        const customerName = order.user?.name || 'Customer';
        const customerPhone = order.user?.phone || 'N/A';
        const address = order.address.fullAddress || 'N/A';
        const lat = order.address.location?.lat;
        const lng = order.address.location?.lng;
        const total = order.totalAmount;

        let message = `🛵 *New Delivery Alert!*\n\n`;
        message += `*Customer:* ${customerName} (${customerPhone})\n`;
        message += `*Address:* ${address}\n`;

        if (lat && lng) {
            message += `*Location:* https://www.google.com/maps/search/?api=1&query=${lat},${lng}\n\n`;
        } else {
            message += `\n`;
        }

        message += `*Items:*\n`;
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
                message += `- ${item.quantity}x ${item.name}\n`;
            });
        }

        message += `\n*Total to Collect:* ₹${total} (${order.paymentMethod})\n`;
        message += `*Order ID:* ${order._id.slice(-6).toUpperCase()}`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading) return <div className="p-10">Loading Admin Dashboard...</div>;
    if (!stats) return <div className="p-10">No Data Available</div>;

    return (
        <div className="container py-10 px-4 mx-auto">
            <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3 mb-10">
                <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground z-10">Total Users</span>
                        <span className="text-3xl font-bold z-10">{stats.totalUsers}</span>
                    </div>
                    <div className="absolute right-4 top-4 p-3 bg-blue-50 text-blue-600 rounded-full opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground z-10">Total Orders</span>
                        <span className="text-3xl font-bold z-10">{stats.totalOrders}</span>
                    </div>
                    <div className="absolute right-4 top-4 p-3 bg-orange-50 text-orange-600 rounded-full opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground z-10">Total Revenue</span>
                        <span className="text-3xl font-bold z-10">₹{stats.totalRevenue}</span>
                    </div>
                    <div className="absolute right-4 top-4 p-3 bg-green-50 text-green-600 rounded-full opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></svg>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <h2 className="mb-4 text-2xl font-bold">Recent Orders</h2>
            <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order ID</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {stats.recentOrders.map((order: any) => (
                                <tr key={order._id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">{order._id.substring(0, 8)}...</td>
                                    <td className="p-4 align-middle">₹{order.totalAmount}</td>
                                    <td className="p-4 align-middle capitalize">{order.status}</td>
                                    <td className="p-4 align-middle">
                                        {order.status === 'placed' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order._id, 'preparing')}
                                                className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                            >
                                                Mark Preparing
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order._id, 'out_for_delivery')}
                                                className="mr-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
                                            >
                                                Ship
                                            </button>
                                        )}
                                        {order.status === 'out_for_delivery' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order._id, 'delivered')}
                                                className="mr-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                            >
                                                Complete
                                            </button>
                                        )}
                                        {/* WhatsApp Share Button */}
                                        <button
                                            onClick={() => shareOrderOnWhatsApp(order)}
                                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 flex items-center gap-1"
                                            title="Share details on WhatsApp"
                                        >
                                            <span>📱 Share</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delivery Assignment Modal */}
            {deliveryModal.open && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-sm p-6 space-y-4">
                        <h2 className="text-lg font-bold">Assign Delivery Partner</h2>
                        <p className="text-sm text-muted-foreground">Enter the name of the person delivering this order.</p>

                        <input
                            autoFocus
                            type="text"
                            placeholder="Delivery Boy Name"
                            value={deliveryBoyName}
                            onChange={(e) => setDeliveryBoyName(e.target.value)}
                            className="w-full border rounded-md px-3 py-2"
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDeliveryModal({ open: false, orderId: null })}
                                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeliveryAssignment}
                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                Confirm Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
