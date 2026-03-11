'use client';

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DiscountDetails {
    code: string;
    value: number;
    discountType: 'percentage' | 'fixed';
    calculatedDiscount: number;
}

interface Coupon {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    minOrderAmount: number;
    maxDiscountAmount?: number;
    expiryDate: string;
    isActive: boolean;
}

export default function CartPage() {
    const { state, clearCart, removeItem } = useCart();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Coupon state
    const [couponCode, setCouponCode] = useState("");
    const [couponError, setCouponError] = useState("");
    const [appliedDiscount, setAppliedDiscount] = useState<DiscountDetails | null>(null);
    const [checkingCoupon, setCheckingCoupon] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const { data } = await api.get('/discounts/active');
                // Filter active and valid coupons (expiry, etc. though backend should ideally filter)
                // But let's show all active ones to the user so they know what exists.
                setAvailableCoupons(data.filter((c: Coupon) => c.isActive && new Date(c.expiryDate) > new Date()));
            } catch (error) {
                console.error("Failed to fetch coupons", error);
            }
        };
        fetchCoupons();
    }, []);

    const handleApplyCoupon = async (codeOverride?: string) => {
        const codeToApply = codeOverride || couponCode;
        if (!codeToApply.trim()) return;

        setCheckingCoupon(true);
        setCouponError("");

        try {
            const { data } = await api.post('/discounts/apply', {
                code: codeToApply,
                orderAmount: state.totalAmount
            });
            setAppliedDiscount(data);
            setCouponCode("");
        } catch (error: any) {
            console.error("Coupon failed", error);
            setAppliedDiscount(null);
            setCouponError(error.response?.data?.message || "Invalid coupon code");
        } finally {
            setCheckingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedDiscount(null);
        setCouponCode("");
        setCouponError("");
    };

    const calculateTotal = () => {
        let total = state.totalAmount + state.deliveryFee; // Use dynamic delivery fee
        if (appliedDiscount) {
            total -= appliedDiscount.calculatedDiscount;
        }
        return Math.max(0, total);
    };

    const handleCheckout = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Please login to proceed.");
            router.push('/login');
            return;
        }

        if (state.totalAmount < state.settings.minOrderValue) {
            alert(`Minimum order value to checkout is ₹${state.settings.minOrderValue}`);
            return;
        }

        let checkoutUrl = '/checkout';
        const params = new URLSearchParams();
        if (appliedDiscount) {
            params.append('coupon', appliedDiscount.code);
            params.append('discount', appliedDiscount.calculatedDiscount.toString());
        }

        if (params.toString()) {
            checkoutUrl += `?${params.toString()}`;
        }

        router.push(checkoutUrl);
    };

    if (state.items.length === 0) {
        return (
            <div className="container flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h1 className="text-2xl font-bold">Your Cart is Empty</h1>
                <p className="text-muted-foreground">Looks like you haven't added anything yet.</p>
                <Link
                    href="/menu"
                    className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Browse Menu
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-10 px-4 mx-auto max-w-4xl">
            <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Cart Items */}
                <div className="md:col-span-2 space-y-4">
                    {state.items.map((item) => (
                        <div key={item._id + (item.variant?.name || '')} className="flex items-center justify-between rounded-lg border p-4 bg-card">
                            <div className="flex-1">
                                <h3 className="font-semibold">
                                    {item.name}
                                    {item.variant && <span className="text-xs text-muted-foreground ml-1">({item.variant.name})</span>}
                                </h3>
                                <p className="text-sm text-muted-foreground">₹{item.price} x {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="font-bold">₹{item.price * item.quantity}</p>
                                <button
                                    onClick={() => removeItem({ _id: item._id, variant: item.variant })}
                                    className="text-muted-foreground hover:text-red-500 transition-colors p-2"
                                    title="Remove Item"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to clear your cart?")) {
                                clearCart();
                            }
                        }}
                        className="text-sm text-red-500 hover:underline"
                    >
                        Clear Cart
                    </button>
                </div>

                {/* Summary */}
                <div className="h-fit space-y-4">
                    <div className="rounded-lg border p-6 bg-muted/20">
                        <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
                        <div className="flex justify-between mb-2">
                            <span>Subtotal</span>
                            <span>₹{state.totalAmount}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span>Delivery Fee</span>
                            <span>{state.deliveryFee === 0 ? <span className="text-green-600">Free</span> : `₹${state.deliveryFee}`}</span>
                        </div>

                        {appliedDiscount && (
                            <div className="flex justify-between mb-2 text-green-600">
                                <span>Discount ({appliedDiscount.code})</span>
                                <span>-₹{appliedDiscount.calculatedDiscount}</span>
                            </div>
                        )}

                        <div className="border-t pt-4 flex justify-between font-bold text-lg mb-6">
                            <span>Total</span>
                            <span>₹{calculateTotal()}</span>
                        </div>

                        {/* Coupon Input */}
                        {!appliedDiscount ? (
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Have a coupon?</label>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Enter code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="flex-1 rounded-md border px-3 py-2 text-sm uppercase"
                                    />
                                    <button
                                        onClick={() => handleApplyCoupon()}
                                        disabled={checkingCoupon || !couponCode}
                                        className="rounded-md bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium hover:bg-secondary/90 disabled:opacity-50"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {couponError && <p className="text-xs text-red-500 mt-1 mb-2">{couponError}</p>}

                                {/* Available Offers Section */}
                                {availableCoupons.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Offers</p>
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                            {availableCoupons.map(coupon => (
                                                <div key={coupon._id} className="border border-dashed border-primary/40 bg-primary/5 rounded-md p-3 flex justify-between items-center group hover:bg-primary/10 transition-colors">
                                                    <div className="flex-1">
                                                        <div className="font-bold text-primary text-sm">{coupon.code}</div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {coupon.discountType === 'percentage'
                                                                ? `Get ${coupon.value}% OFF up to ₹${coupon.maxDiscountAmount}`
                                                                : `Flat ₹${coupon.value} OFF`}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                                            Min Order: ₹{coupon.minOrderAmount}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleApplyCoupon(coupon.code)}
                                                        className="text-xs px-2 py-1 bg-white border border-primary text-primary font-bold rounded shadow-sm hover:bg-primary hover:text-white transition-all transform active:scale-95"
                                                    >
                                                        APPLY
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mb-6 bg-green-50 border border-green-200 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-green-800">Coupon Applied</p>
                                    <p className="text-xs text-green-600">{appliedDiscount.code} saved you ₹{appliedDiscount.calculatedDiscount}</p>
                                </div>
                                <button onClick={handleRemoveCoupon} className="text-xs text-red-600 font-medium hover:underline">Remove</button>
                            </div>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Proceed to Checkout"}
                        </button>
                        {state.totalAmount < state.settings.minOrderValue && (
                            <p className="text-xs text-red-500 text-center mt-2">
                                Add items worth ₹{state.settings.minOrderValue - state.totalAmount} more to checkout
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
