'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSocket } from '@/context/SocketContext';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-muted animate-pulse flex items-center justify-center">Loading Map...</div>
});

interface Order {
    _id: string;
    user: { name: string; phone: string; email: string };
    items: {
        name: string;
        quantity: number;
        price: number;
        _id: string;
        variant?: { name: string; price: number }
    }[];
    totalAmount: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    transactionId?: string;
    address: { fullAddress: string; location: { lat: number; lng: number } } | string;
    createdAt: string;
    couponApplied?: string;
    discountAmount: number;
    deliveryInfo?: {
        deliveryBoyName?: string;
        contactNumber?: string;
    };
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [deliveryModal, setDeliveryModal] = useState<{ open: boolean; orderId: string | null }>({ open: false, orderId: null });
    const [deliveryBoyName, setDeliveryBoyName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const router = useRouter();

    const fetchOrders = async (page = 1) => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/orders?page=${page}&limit=20`);
            setOrders(res.data.orders);
            setCurrentPage(res.data.page);
            setTotalPages(res.data.pages);
            setTotalOrders(res.data.total);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const { socket } = useSocket();

    useEffect(() => {
        fetchOrders(currentPage);

        if (socket) {
            socket.on('orderStatusUpdated', () => {
                fetchOrders(currentPage);
            });
            socket.on('newOrder', () => {
                fetchOrders(currentPage);
            });

            return () => {
                socket.off('orderStatusUpdated');
                socket.off('newOrder');
            };
        }
    }, [socket, currentPage]);

    const handleStatusUpdate = async (orderId: string, transformTostatus: string) => {
        try {
            let deliveryInfo = null;
            let statusToSend = transformTostatus;

            // Normalize status based on backend enum requirements
            if (transformTostatus === 'preparing' || transformTostatus === 'Preparing') {
                statusToSend = 'Preparing';
            } else if (transformTostatus === 'out_for_delivery' || transformTostatus === 'Out for Delivery') {
                // Open Modal
                setDeliveryModal({ open: true, orderId });
                return;
            } else if (transformTostatus === 'delivered' || transformTostatus === 'Delivered') {
                statusToSend = 'Delivered';
            }

            // Note: If 'placed' or 'cancelled' passed directly, it maps as is. 
            if (statusToSend === 'placed') statusToSend = 'Placed';
            if (statusToSend === 'cancelled') statusToSend = 'Cancelled';

            await api.put(`/admin/order/${orderId}`, { status: statusToSend, deliveryInfo });

            // Optimistic update
            setOrders(orders.map(o => o._id === orderId ? { ...o, status: statusToSend, deliveryInfo: deliveryInfo || o.deliveryInfo } : o));
            if (selectedOrder?._id === orderId) {
                // @ts-ignore
                setSelectedOrder({ ...selectedOrder, status: statusToSend });
            }
            alert(`Order updated to ${statusToSend}`);
        } catch (error: any) {
            console.error("Update failed", error);
            const errorMessage = error.response?.data?.message || error.message || "Unknown error";
            alert(`Failed to update status: ${errorMessage}`);
        }
    };

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

            setOrders(orders.map(o => o._id === orderId ? { ...o, status: statusToSend, deliveryInfo } : o));
            if (selectedOrder?._id === orderId) {
                // @ts-ignore
                setSelectedOrder({ ...selectedOrder, status: statusToSend });
            }

            setDeliveryModal({ open: false, orderId: null });
            setDeliveryBoyName('');
        } catch (error: any) {
            console.error("Update failed", error);
            const errorMessage = error.response?.data?.message || error.message;
            alert(`Failed to assign delivery: ${errorMessage}`);
        }
    };

    const shareOrderOnWhatsApp = (order: Order) => {
        if (!order || !order.address) return;

        const customerName = order.user?.name || 'Customer';
        const customerPhone = order.user?.phone || 'N/A';
        const address = typeof order.address === 'string' ? order.address : order.address.fullAddress;
        // @ts-ignore
        const lat = order.address?.location?.lat;
        // @ts-ignore
        const lng = order.address?.location?.lng;
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
        order.items.forEach((item) => {
            message += `- ${item.quantity}x ${item.name}\n`;
        });

        message += `\n*Total to Collect:* ₹${total} (${order.paymentMethod})\n`;
        message += `*Order ID:* ${order._id.slice(-6).toUpperCase()}`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const renderAddress = (address: Order['address']) => {
        if (typeof address === 'string') {
            return <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md leading-relaxed">{address}</p>;
        }
        return (
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md leading-relaxed">{address.fullAddress}</p>
                <div className="h-[200px] w-full rounded-md overflow-hidden border">
                    <MapComponent position={[address.location.lat, address.location.lng]} setPosition={() => { }} />
                </div>
                <p className="text-xs text-muted-foreground">Location Pin provided by user.</p>
            </div>
        );
    };

    if (loading) return (
        <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="relative">
            <h1 className="text-2xl font-bold mb-6">Manage Orders</h1>
            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-4 mb-6">
                {Array.isArray(orders) && orders.map((order) => (
                    <div key={order?._id} className="bg-card p-4 rounded-lg border shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    {order?._id?.slice(-6).toUpperCase()}
                                </span>
                                <h3 className="font-medium mt-1">{order.user ? order.user.name : 'Unknown'}</h3>
                                <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                }`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                            <div className="font-medium">
                                {order.items.length} Items
                            </div>
                            <span className="font-bold text-lg">₹{order.totalAmount}</span>
                        </div>

                        {/* Controls */}
                        <div className="pt-3 border-t flex flex-col gap-3">
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm bg-background"
                            >
                                <option value="placed">Placed</option>
                                <option value="preparing">Preparing</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium w-full"
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => shareOrderOnWhatsApp(order)}
                                    className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 text-sm font-medium w-full flex items-center justify-center gap-2"
                                >
                                    <span>📱 Share</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block rounded-md border bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="p-3 text-left font-medium">Order ID</th>
                            <th className="p-3 text-left font-medium">Customer</th>
                            <th className="p-3 text-left font-medium">Total</th>
                            <th className="p-3 text-left font-medium">Date</th>
                            <th className="p-3 text-left font-medium">Status</th>
                            <th className="p-3 text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {Array.isArray(orders) && orders.map((order) => (
                            <tr key={order?._id} className="hover:bg-muted/50 transition-colors">
                                <td className="p-3 font-mono text-xs">{order?._id?.slice(-6).toUpperCase()}</td>
                                <td className="p-3 font-medium">{order?.user ? order.user.name : 'Unknown User'}</td>
                                <td className="p-3">₹{order?.totalAmount}</td>
                                <td className="p-3 text-xs text-muted-foreground">{order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                                <td className="p-3">
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                        className={`border rounded px-2 py-1 text-xs font-medium cursor-pointer focus:ring-2 ring-primary border-none outline-none ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}
                                    >
                                        <option value="placed">Placed</option>
                                        <option value="preparing">Preparing</option>
                                        <option value="out_for_delivery">Out for Delivery</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td className="p-3">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="text-primary hover:underline font-medium text-xs"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => shareOrderOnWhatsApp(order)}
                                        className="ml-2 text-green-600 hover:text-green-800 font-medium text-xs flex items-center inline-flex"
                                    >
                                        📱 Share
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
                <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{orders.length}</span> of <span className="font-medium text-foreground">{totalOrders}</span> orders
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || loading}
                        className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                        Previous
                    </button>
                    <div className="flex items-center px-4 text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </div>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || loading}
                        className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <div>
                                <h2 className="text-xl font-bold">Order Details</h2>
                                <p className="text-sm text-muted-foreground">ID: {selectedOrder._id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-muted rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 grid gap-6 md:grid-cols-2">
                            {/* Customer Info */}
                            <div>
                                <h3 className="font-semibold mb-2">Customer Information</h3>
                                <div className="text-sm space-y-1 text-muted-foreground">
                                    <p><span className="font-medium text-foreground">Name:</span> {selectedOrder.user?.name}</p>
                                    <p><span className="font-medium text-foreground">Phone:</span> {selectedOrder.user?.phone || 'N/A'}</p>
                                    <p><span className="font-medium text-foreground">Email:</span> {selectedOrder.user?.email || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div>
                                <h3 className="font-semibold mb-2">Delivery Address</h3>
                                {renderAddress(selectedOrder.address)}
                            </div>

                            {/* Order Items */}
                            <div className="md:col-span-2">
                                <h3 className="font-semibold mb-3">Order Items</h3>
                                <div className="border rounded-md divide-y">
                                    {selectedOrder.items.map((item) => (
                                        <div key={item._id} className="p-3 flex justify-between items-start text-sm">
                                            <div className="flex items-start gap-2">
                                                <span className="font-bold w-6 h-6 flex items-center justify-center bg-primary/10 rounded text-primary text-xs shrink-0 mt-0.5">
                                                    {item.quantity}x
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.name}</span>
                                                    {item.variant && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Variant: {item.variant.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span>₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="md:col-span-2 bg-muted/20 p-4 rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Payment Method</span>
                                    <span className="text-sm">{selectedOrder.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Payment Status</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedOrder.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {selectedOrder.paymentStatus}
                                    </span>
                                </div>
                                {selectedOrder.discountAmount > 0 && (
                                    <div className="flex justify-between items-center mb-2 text-green-600">
                                        <span className="text-sm">Discount</span>
                                        <span className="text-sm">-₹{selectedOrder.discountAmount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t mt-2">
                                    <span className="font-bold">Total Amount</span>
                                    <span className="font-bold text-lg">₹{selectedOrder.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
