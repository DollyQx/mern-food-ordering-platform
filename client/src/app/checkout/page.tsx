'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { STANDARD_PINCODES } from '@/lib/availability-utils';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-muted animate-pulse flex items-center justify-center">Loading Map...</div>
});

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
    const { state: { items, totalAmount, deliveryFee }, clearCart, refreshSettings } = useCart(); // Added deliveryFee
    const [address, setAddress] = useState('123 Delivery St, Tasty Town'); // Default for now
    const [paymentMethod, setPaymentMethod] = useState<'Online'>('Online');
    const [pincode, setPincode] = useState('');
    const [loading, setLoading] = useState(false);

    // Map State
    const [position, setPosition] = useState<[number, number]>([28.6139, 77.2090]); // Default: New Delhi
    const [mapOpen, setMapOpen] = useState(false);
    // Search Address State
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Check for Coupon in localStorage or Context (assuming passed via URL or Context, 
    // but for now re-implementing basic calculation or relying on CartContext if it had it.
    // Since CartContext only has items/total, and Coupon logic was in Cart Page, 
    // ideally we should move Coupon state to Context. 
    // For this step, I will assume Coupon is applied in Cart and passed here? 
    // No, strictly following user flow: Cart -> Checkout.
    // The previous implementation calculated discount in Cart Page local state.
    // To make this robust, I should really move discount to Context, but to save time/complexity and stick to task:
    // I will read URL params or simply ask user to re-apply, OR simpler:
    // Let's assume totalAmount in Context *is* the final amount? 
    // Checking CartContext... it sums up items price * quantity. It doesn't seem to hold discount.
    // So the discount calculated in Cart Page is lost if navigating away? 
    // That's a bug/feature gap. The User logic in Cart Page:
    // "const handleCheckout = ... sends discountAmount"
    // So if I redirect to Checkout, I need to pass this state.
    // I can use query params.

    const [userPoints, setUserPoints] = useState(0);
    const [usePoints, setUsePoints] = useState(false);

    // Restore accidental deletion
    const [couponCode, setCouponCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);

    // Derived state for points discount
    // Logic: 1 Point = ₹1. Can use points up to 100% of order value (or restrict if needed).
    const maxRedeemable = Math.min(userPoints, totalAmount + deliveryFee - discountAmount);
    const pointsDiscount = usePoints ? maxRedeemable : 0;

    const finalTotal = Math.max(0, totalAmount + deliveryFee - discountAmount - pointsDiscount);

    const router = useRouter();

    useEffect(() => {
        // Load Razorpay Script efficiently
        const SCRIPT_ID = 'razorpay-checkout-script';
        if (!document.getElementById(SCRIPT_ID)) {
            const script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
        }

        // Fetch user profile for points
        api.get('/user/profile').then(res => {
            if (res.data && res.data.walletBalance) {
                setUserPoints(res.data.walletBalance);
            }
        }).catch(err => console.error("Failed to fetch points", err));

        // Parse Coupon Params
        const searchParams = new URLSearchParams(window.location.search);
        const coupon = searchParams.get('coupon');
        const discount = searchParams.get('discount');
        if (coupon) setCouponCode(coupon);
        if (discount) setDiscountAmount(Number(discount));

        // Check User Address & Autofill
        const userStr = localStorage.getItem('user');
        let addressFound = false;
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.address && user.address.fullAddress) {
                    let formattedAddress = user.address.fullAddress;
                    // Prepend Apartment/Street if they exist and aren't obviously part of the string (simple heuristic)
                    const extraParts = [];
                    if (user.address.apartment) extraParts.push(user.address.apartment);
                    if (user.address.street) extraParts.push(user.address.street);
                    if (extraParts.length > 0) {
                        formattedAddress = `${extraParts.join(', ')}, ${formattedAddress}`;
                    }

                    setAddress(formattedAddress);
                    addressFound = true;

                    if (user.address.location && user.address.location.lat) {
                        setPosition([user.address.location.lat, user.address.location.lng]);
                        setMapOpen(true);
                    }
                }
            } catch (e) {
                console.error("Failed to parse user for address autofill", e);
            }
        }

        // Attempt Initial Geolocation only if no saved address (and no address found in local storage)
        if (!addressFound && address === '123 Delivery St, Tasty Town') {
            handleDetectLocation();
        }

        return () => {
            const script = document.getElementById(SCRIPT_ID);
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);


    const handleDetectLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);
                setMapOpen(true);
                await reverseGeocode(latitude, longitude);
            }, (err) => {
                console.error("Geolocation Error", err);
                alert("Could not detect location. Please select on map or enter manually.");
            });
        }
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
                if (data.address && data.address.postcode) {
                    setPincode(data.address.postcode);
                }
            }
        } catch (error) {
            // Silently fail or minimal log
        }
    };

    // When marker moves
    const handleMapClick = async (pos: [number, number]) => {
        setPosition(pos);
        await reverseGeocode(pos[0], pos[1]);
    };

    const handleAddressSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search failed", error);
            // toast.error("Search failed");
        } finally {
            setSearching(false);
        }
    };

    const selectSearchResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        setPosition([lat, lon]);
        setAddress(result.display_name);
        setSearchModalOpen(false);
        setMapOpen(true);
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            // 1. Validate Pincode Format
            if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode)) {
                toast.error('Please enter a valid 6-digit Pincode');
                setLoading(false);
                return;
            }

            // 2. Validate Delivery Logic
            const isStandardPincode = STANDARD_PINCODES.includes(pincode);

            if (!isStandardPincode) {
                // If not standard pincode, check if ANY item is restricted (not LongDistance)
                // Note: items.isLongDistance might be undefined for old items, assume false (restricted) if missing
                const restrictedItems = items.filter(i => !i.isLongDistance);

                if (restrictedItems.length > 0) {
                    toast.error(`Some items are not available in ${pincode}. Remove them to proceed: ${restrictedItems.map(i => i.name).join(', ')}`);
                    setLoading(false);
                    return;
                }
            }

            // Online Payment Flow
            // 1. Initiate Order (Create DB Order as Pending)
            const initiateRes = await api.post('/orders/initiate', {
                items: items.map(i => ({
                    menuItem: i._id,
                    quantity: i.quantity,
                    price: i.price,
                    name: i.name,
                    variant: i.variant
                })),
                totalAmount: finalTotal,
                address: {
                    fullAddress: address,
                    pincode: pincode,
                    location: { lat: position[0], lng: position[1] }
                },
                couponCode: couponCode || undefined,
                discountAmount: discountAmount + pointsDiscount,
                pointsUsed: pointsDiscount,
                deliveryFee,
                paymentMethod: 'Online'
            });

            const { order, razorpayOrderId, amount, currency, key } = initiateRes.data;
            const dbOrderId = order._id;

            // 2. Open Razorpay
            const options = {
                key: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                amount: amount,
                currency: currency,
                name: 'Zomoggy',
                description: 'Food Order',
                order_id: razorpayOrderId,
                handler: async function (response: any) {
                    // 3. Confirm Order (Update DB to Paid)
                    try {
                        await api.post('/orders/confirm', {
                            orderId: dbOrderId,
                            paymentDetails: {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            }
                        });
                        toast.success('Payment Successful! Order Placed.');
                        clearCart();
                        router.push('/orders');
                    } catch (err) {
                        console.error(err);
                        toast.error('Payment Verification Failed but Order Saved.');
                        // Verify redundancy: user calls support with Order ID
                    }
                },
                prefill: {
                    name: 'User Name', // Should fetch from User Context
                    email: 'user@example.com',
                    contact: '9999999999'
                },
                theme: {
                    color: '#F37254'
                },
                modal: {
                    ondismiss: function () {
                        toast.error('Payment Cancelled. Order saved as Pending.');
                        // Redirect to orders page so they can retry? 
                        // Or stay here?
                        // If we redirect, they see 'Pending' order.
                        // Ideally, we should redirect to /orders to show the pending order.
                        router.push('/orders');
                    }
                }
            };
            const rzp1 = new window.Razorpay(options);
            rzp1.open();
            rzp1.on('payment.failed', function (response: any) {
                toast.error(response.error.description);
                // The order is already in DB as Pending/Placed-Pending. 
                // We could call an API to mark it Failed if we want, but it stays Pending/Failed.
            });
        } catch (error: any) {
            console.error('Order placement failed:', error);
            const msg = error.response?.data?.message || 'Failed to initiate order.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="container flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h1 className="text-2xl font-bold">Checkout</h1>
                <p className="text-muted-foreground">Your cart is empty.</p>
                <div
                    onClick={() => router.push('/menu')}
                    className="cursor-pointer text-primary hover:underline"
                >
                    Return to Menu
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl py-10 px-4 mx-auto">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            {/* Order Summary */}
            <div className="bg-card border rounded-lg p-6 mb-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                {items.map(item => (
                    <div key={item._id} className="flex justify-between py-2 border-b last:border-0">
                        <span className={item.isFreeGift ? "text-green-600 font-medium" : ""}>
                            {item.name} x {item.quantity} {item.isFreeGift && "(Free!)"}
                        </span>
                        <span>₹{item.price * item.quantity}</span>
                    </div>
                ))}
                <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>₹{totalAmount}</span>
                    </div>
                    {/* Delivery Fee Section */}
                    <div className="flex justify-between text-muted-foreground">
                        <span>Delivery Fee</span>
                        {deliveryFee === 0 ? (
                            <span className="text-green-600">Free</span>
                        ) : (
                            <span>₹{deliveryFee}</span>
                        )}
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Coupon Discount</span>
                            <span>-₹{discountAmount}</span>
                        </div>
                    )}
                    {/* Zomo Points UI */}
                    {userPoints > 0 && (
                        <div className="py-2 border-t border-dashed my-2">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={usePoints}
                                        onChange={(e) => setUsePoints(e.target.checked)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">Use Zomo Points</span>
                                        <span className="text-xs text-muted-foreground">Available: {userPoints} Pts</span>
                                    </div>
                                </div>
                                <span className="font-bold text-primary">
                                    -₹{usePoints ? maxRedeemable : 0}
                                </span>
                            </label>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>₹{finalTotal}</span>
                    </div>
                </div>
            </div>

            {/* Address Form & Map */}
            <div className="bg-card border rounded-lg p-6 mb-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Delivery Address</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSearchModalOpen(true)}
                            className="text-sm bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md hover:bg-secondary/90 font-medium flex items-center gap-2"
                        >
                            🔍 Search
                        </button>
                        <button
                            onClick={handleDetectLocation}
                            className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium flex items-center gap-2"
                        >
                            📍 Detect Me
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-3 border rounded-md bg-background min-h-[80px]"
                        placeholder="Enter your delivery address..."
                        required
                    />
                    <div>
                        <input
                            type="text"
                            value={pincode}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setPincode(val);
                            }}
                            className="w-full p-3 border rounded-md bg-background h-[80px]"
                            placeholder="Enter Pincode (e.g. 110059)"
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Standard Delivery: {STANDARD_PINCODES.join(', ')}. Extended delivery for select items.
                        </p>
                    </div>
                </div>

                {/* Map Section */}
                <div className="h-[300px] w-full rounded-md overflow-hidden border">
                    <MapComponent position={position} setPosition={handleMapClick} />
                </div>
                <p className="text-xs text-muted-foreground">Tip: Drag the marker to pinpoint your location.</p>
            </div>

            {/* Address Search Modal */}
            {searchModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Search Address</h2>
                            <button onClick={() => setSearchModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                ✕
                            </button>
                        </div>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="E.g. Connaught Place"
                                className="flex-1 border roundedpx-3 py-2 px-3 focus:outline-none focus:ring-2 ring-primary bg-background"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                                autoFocus
                            />
                            <button
                                onClick={handleAddressSearch}
                                disabled={searching}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium disabled:opacity-50"
                            >
                                {searching ? '...' : 'Go'}
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 space-y-2">
                            {searchResults.length === 0 && !searching && searchQuery && (
                                <p className="text-center text-muted-foreground text-sm py-4">No results found</p>
                            )}
                            {searchResults.map((result, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectSearchResult(result)}
                                    className="w-full text-left p-3 border rounded hover:bg-muted text-sm transition-colors"
                                >
                                    <p className="font-medium line-clamp-1">{result.display_name.split(',')[0]}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{result.display_name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Method */}
            <div className="bg-card border rounded-lg p-6 mb-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">

                    <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors border-primary bg-primary/5 ring-1 ring-primary`}>
                        <input
                            type="radio"
                            name="payment"
                            value="Online"
                            checked={true}
                            readOnly
                            className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="ml-3 font-medium">Online Payment (Razorpay)</span>
                    </label>
                </div>
            </div>

            <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-4 rounded-lg text-lg font-bold hover:bg-primary/90 transition-opacity disabled:opacity-70"
            >
                {loading ? 'Processing...' : `Place Order • ₹${finalTotal}`}
            </button>
        </div>
    );
}
