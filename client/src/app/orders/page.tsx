'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { OrderStepper } from '@/components/OrderStepper';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface OrderItem {
    menuItem: { name: string; image?: string };
    name: string;
    quantity: number;
    price: number;
    _id: string;
}

interface Order {
    _id: string;
    items: OrderItem[];
    totalAmount: number;
    status: string;
    createdAt: string;
    transactionId?: string;
    couponApplied?: string;
    discountAmount: number;
    deliveryInfo?: {
        deliveryBoyName?: string;
        contactNumber?: string;
    };
    cancellationReason?: string;
    refundAmount?: number;
    isRefundable?: boolean;
}

import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('orderStatusUpdated', ({ orderId, status, deliveryInfo }) => {
            setOrders(prevOrders => prevOrders.map(order =>
                order._id === orderId ? { ...order, status, deliveryInfo } : order
            ));
            toast.info(`Order #${orderId.slice(-6).toUpperCase()} status updated to ${status}`);
        });

        return () => {
            socket.off('orderStatusUpdated');
        };
    }, [socket]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/orders/myorders');
                setOrders(data);
            } catch (error) {
                console.error('Failed to fetch orders', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        orderId: string | null;
    }>({
        isOpen: false,
        orderId: null
    });

    const initiateCancelOrder = (orderId: string) => {
        setConfirmDialog({ isOpen: true, orderId });
    };

    const handleConfirmCancel = async () => {
        const orderId = confirmDialog.orderId;
        if (!orderId) return;

        setConfirmDialog({ isOpen: false, orderId: null });

        try {
            const { data } = await api.post(`/orders/${orderId}/cancel`, {});
            toast.success(data.message);
            // Update local state
            setOrders(prevOrders => prevOrders.map(order =>
                order._id === orderId
                    ? { ...order, status: 'Cancelled' }
                    : order
            ));
        } catch (error: any) {
            console.error('Failed to cancel order', error);
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    if (loading) {
        return <div className="p-10 text-center">Loading orders...</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="container flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h1 className="text-2xl font-bold">No Past Orders</h1>
                <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                <Link
                    href="/menu"
                    className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Order Now
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-10 px-4 mx-auto max-w-4xl">
            <h1 className="mb-8 text-3xl font-bold">Your Orders</h1>

            <div className="space-y-6">
                {orders.map((order) => (
                    <div key={order._id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 border-b flex flex-wrap gap-4 justify-between items-center bg-muted/20">
                            <div>
                                <p className="font-semibold">Order #{order._id.slice(-6).toUpperCase()}</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold mt-1 text-lg">₹{order.totalAmount}</p>
                                {/* Cancel Button */}
                                {['Placed', 'Preparing'].includes(order.status) && (
                                    <button
                                        onClick={() => initiateCancelOrder(order._id)}
                                        className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stepper Status */}
                        <div className="px-6 pt-4 pb-2">
                            {order.status === 'Cancelled' ? (
                                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center font-medium">
                                    This order has been cancelled.
                                    {order.refundAmount !== undefined && (
                                        <span className="block text-sm mt-1">Refund Amount: ₹{order.refundAmount}</span>
                                    )}
                                </div>
                            ) : (
                                <OrderStepper currentStatus={order.status} deliveryInfo={order.deliveryInfo} />
                            )}
                        </div>

                        <div className="p-6 pt-2">
                            <ul className="space-y-3">
                                {order.items.map((item) => (
                                    <li key={item._id} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                            {(order.couponApplied || order.discountAmount > 0) && (
                                <div className="mt-4 pt-4 border-t text-sm text-green-600 flex justify-between">
                                    <span>Discount Applied ({order.couponApplied})</span>
                                    <span>-₹{order.discountAmount}</span>
                                </div>
                            )}
                            {/* Optional Reorder Button or details link */}
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Cancel Order?"
                message="Are you sure you want to cancel this order? A cancellation fee of ₹20 will be deducted from your refund amount."
                onConfirm={handleConfirmCancel}
                onCancel={() => setConfirmDialog({ isOpen: false, orderId: null })}
                confirmText="Yes, Cancel Order"
                confirmButtonClass="bg-red-600 text-white hover:bg-red-700"
            />
        </div>
    );
}
