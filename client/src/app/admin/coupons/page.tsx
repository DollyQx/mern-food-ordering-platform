'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Coupon {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    minOrderAmount: number;
    maxDiscountAmount?: number;
    expiryDate: string;
    isActive: boolean;
    usageLimit: number;
    usedCount: number;
}

export default function CouponManagement() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'percentage',
        value: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        expiryDate: '',
        usageLimit: '100',
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const { data } = await api.get('/discounts/coupons');
            setCoupons(data);
        } catch (error) {
            console.error("Failed to fetch coupons", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/discounts/coupons', newCoupon);
            alert('Coupon created successfully');
            setNewCoupon({
                code: '',
                discountType: 'percentage',
                value: '',
                minOrderAmount: '',
                maxDiscountAmount: '',
                expiryDate: '',
                usageLimit: '100',
            });
            fetchCoupons();
        } catch (error) {
            console.error('Failed to create coupon', error);
            alert('Failed to create coupon');
        }
    };

    if (loading) return <div className="p-8">Loading Coupons...</div>;

    return (
        <div className="container py-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Coupon Management</h1>

            <div className="grid lg:grid-cols-3 gap-8 mb-10">
                {/* Create Coupon Form */}
                <div className="p-6 border rounded-lg shadow-sm bg-card lg:col-span-1 h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Create New Coupon</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Coupon Code</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md uppercase"
                                placeholder="WELCOME50"
                                value={newCoupon.code}
                                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Type</label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={newCoupon.discountType}
                                    onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Value</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-md"
                                    placeholder={newCoupon.discountType === 'percentage' ? "50" : "100"}
                                    value={newCoupon.value}
                                    onChange={e => setNewCoupon({ ...newCoupon, value: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Min Order (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-md"
                                    value={newCoupon.minOrderAmount}
                                    onChange={e => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })}
                                />
                            </div>
                            {newCoupon.discountType === 'percentage' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Max Discount (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-md"
                                        value={newCoupon.maxDiscountAmount}
                                        onChange={e => setNewCoupon({ ...newCoupon, maxDiscountAmount: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Expiry Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-md"
                                value={newCoupon.expiryDate}
                                onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Usage Limit</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-md"
                                value={newCoupon.usageLimit}
                                onChange={e => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition"
                        >
                            Create Coupon
                        </button>
                    </form>
                </div>

                {/* Coupons List */}
                <div className="lg:col-span-2">
                    <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-foreground">Active Coupons</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="p-4">Code</th>
                                        <th className="p-4">Discount</th>
                                        <th className="p-4">Min Order</th>
                                        <th className="p-4">Expiry</th>
                                        <th className="p-4">Usage</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {coupons.map((coupon) => (
                                        <tr key={coupon._id} className="hover:bg-muted/50">
                                            <td className="p-4 font-bold">{coupon.code}</td>
                                            <td className="p-4">
                                                {coupon.discountType === 'percentage'
                                                    ? `${coupon.value}% OFF ${coupon.maxDiscountAmount ? `(upto ₹${coupon.maxDiscountAmount})` : ''}`
                                                    : `₹${coupon.value} OFF`
                                                }
                                            </td>
                                            <td className="p-4">₹{coupon.minOrderAmount}</td>
                                            <td className="p-4">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                                            <td className="p-4">{coupon.usedCount} / {coupon.usageLimit}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${new Date(coupon.expiryDate) > new Date()
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {new Date(coupon.expiryDate) > new Date() ? 'Active' : 'Expired'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {coupons.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                No coupons found. Create one to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
