'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Settings {
    siteName: string;
    deliveryFee: number;
    minOrderValue: number;
    taxRate: number;
    currency: string;
    freeDeliveryThreshold?: number;
    freeGiftThreshold?: number;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        siteName: '',
        deliveryFee: 0,
        minOrderValue: 0,
        taxRate: 0,
        currency: 'INR'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/admin/settings');
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: name === 'siteName' || name === 'currency' ? value : Number(value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        try {
            const { data } = await api.put('/admin/settings', settings);
            setSettings(data);
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error) {
            console.error('Failed to update settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-muted-foreground animate-pulse">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-6 mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Global Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your application's global configuration, including pricing and fees.
                </p>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="bg-card border rounded-lg shadow-sm">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">General Configuration</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="siteName">
                                Website Name
                            </label>
                            <input
                                id="siteName"
                                name="siteName"
                                value={settings.siteName}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Zomoggy"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                This is the name displayed in the browser tab and emails.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="currency">
                                Currency Symbol
                            </label>
                            <input
                                id="currency"
                                name="currency"
                                value={settings.currency}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="INR"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Financial Settings</h3>
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="deliveryFee">
                                    Delivery Fee
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <input
                                        id="deliveryFee"
                                        name="deliveryFee"
                                        type="number"
                                        min="0"
                                        value={settings.deliveryFee}
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Fixed cost added to every order.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="minOrderValue">
                                    Minimum Order Value
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <input
                                        id="minOrderValue"
                                        name="minOrderValue"
                                        type="number"
                                        min="0"
                                        value={settings.minOrderValue}
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Minimum cart value required to checkout.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="taxRate">
                                    Tax Rate (%)
                                </label>
                                <div className="relative">
                                    <input
                                        id="taxRate"
                                        name="taxRate"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={settings.taxRate}
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Percentage tax applied to subtotal.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="freeDeliveryThreshold">
                                    Free Delivery Above (₹)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <input
                                        id="freeDeliveryThreshold"
                                        name="freeDeliveryThreshold"
                                        type="number"
                                        min="0"
                                        value={settings.freeDeliveryThreshold || ''}
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="300"
                                    />
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Cart value to waive delivery fee.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="freeGiftThreshold">
                                    Free Gift Above (₹)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <input
                                        id="freeGiftThreshold"
                                        name="freeGiftThreshold"
                                        type="number"
                                        min="0"
                                        value={settings.freeGiftThreshold || ''}
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="400"
                                    />
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Cart value to award free gift.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2 ${saving ? 'opacity-75' : ''}`}
                        >
                            {saving ? (
                                <>
                                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
