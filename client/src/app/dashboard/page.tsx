'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-muted animate-pulse flex items-center justify-center">Loading Map...</div>
});

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Address State
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressForm, setAddressForm] = useState({
        fullAddress: '',
        apartment: '',
        street: '',
        location: { lat: 28.6139, lng: 77.2090 } // Default Delhi
    });
    const [savingAddress, setSavingAddress] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // First try local storage for immediate render
                const localUser = localStorage.getItem('user');
                if (localUser) {
                    const parsed = JSON.parse(localUser);
                    setUser(parsed);
                    if (parsed.address) {
                        setAddressForm(prev => ({ ...prev, ...parsed.address }));
                    }
                }

                // Fetch fresh data
                const res = await api.get('/user/profile');
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));

                if (res.data.address) {
                    setAddressForm({
                        fullAddress: res.data.address.fullAddress || '',
                        apartment: res.data.address.apartment || '',
                        street: res.data.address.street || '',
                        location: res.data.address.location || { lat: 28.6139, lng: 77.2090 }
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
                if (!localStorage.getItem('user')) {
                    router.push('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleDetectLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                setAddressForm(prev => ({
                    ...prev,
                    location: { lat: latitude, lng: longitude }
                }));
                // Reverse geocode
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data && data.display_name) {
                        setAddressForm(prev => ({ ...prev, fullAddress: data.display_name }));
                    }
                } catch (e) {
                    console.error("Geocoding failed", e);
                }
            }, (err) => {
                console.error(err);
                alert("Could not detect location.");
            });
        }
    };

    const handleMapClick = async (pos: [number, number]) => {
        setAddressForm(prev => ({
            ...prev,
            location: { lat: pos[0], lng: pos[1] }
        }));
        // Reverse geocode
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}`);
            const data = await res.json();
            if (data && data.display_name) {
                setAddressForm(prev => ({ ...prev, fullAddress: data.display_name }));
            }
        } catch (e) {
            console.error("Geocoding failed", e);
        }
    };

    const handleSaveAddress = async () => {
        setSavingAddress(true);
        try {
            const res = await api.put('/user/address', { address: addressForm });
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            setShowAddressModal(false);
            alert("Address Saved Successfully!");
        } catch (error) {
            console.error("Failed to save address", error);
            alert("Failed to save address.");
        } finally {
            setSavingAddress(false);
        }
    };

    if (loading && !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl pb-24">
            <h1 className="text-3xl font-bold mb-8">User Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Account Details */}
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                        <h2 className="text-xl font-semibold">Your Account</h2>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground mt-2">Email</p>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground mt-2">Phone</p>
                        <p className="font-medium">{user.phone || 'Not added'}</p>
                    </div>
                    {/* <button className="mt-4 text-sm text-primary hover:underline">Edit Profile</button> */}
                </div>

                {/* Address Section */}
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-orange-100 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                        </div>
                        <h2 className="text-xl font-semibold">Your Address</h2>
                    </div>
                    {user.address ? (
                        <div className="space-y-1">
                            {user.address.apartment && <p className="font-medium">{user.address.apartment}</p>}
                            {user.address.street && <p>{user.address.street}</p>}
                            <p className="text-sm text-muted-foreground mt-1">{user.address.fullAddress}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No address saved yet.</p>
                    )}
                    <button
                        onClick={() => setShowAddressModal(true)}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm font-bold hover:bg-primary/90 transition-colors"
                    >
                        {user.address ? 'Edit Address' : 'Add Address'}
                    </button>
                </div>

                {/* Orders */}
                <Link href="/orders" className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                            </div>
                            <h2 className="text-xl font-semibold group-hover:text-primary">Orders</h2>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6" /></svg>
                    </div>
                    <p className="text-muted-foreground">View your recent orders and track current deliveries.</p>
                </Link>

                {/* Rewards */}
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
                        </div>
                        <h2 className="text-xl font-semibold">Rewards</h2>
                    </div>
                    <div className="text-center py-4">
                        <span className="text-4xl font-bold text-primary">{user?.walletBalance || 0}</span>
                        <p className="text-sm text-muted-foreground mt-1">Zomo Points</p>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">Earn points on every order!</p>
                </div>

                {/* Coupons */}
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M3.6 20.4A10 10 0 1 0 20.4 3.6 10 10 0 0 0 3.6 20.4Z" /><path d="m9 15 6-6" /><path d="M14.99 9 15 9" /><path d="M8.99 15 9 15" /></svg>
                        </div>
                        <h2 className="text-xl font-semibold">Coupons</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="border-l-4 border-primary bg-muted/50 p-3 rounded-r-md">
                            <p className="font-bold text-primary">WELCOME50</p>
                            <p className="text-xs text-muted-foreground">Get 50% off on your first order</p>
                        </div>
                        <div className="border-l-4 border-green-500 bg-muted/50 p-3 rounded-r-md">
                            <p className="font-bold text-green-600">FREEDEL</p>
                            <p className="text-xs text-muted-foreground">Free delivery on orders above ₹500</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        router.push('/login');
                    }}
                    className="text-red-500 hover:text-red-700 font-medium"
                >
                    Log Out
                </button>
            </div>

            {/* Edit Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">Manage Address</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Select Location on Map</label>
                                    <div className="h-[250px] w-full rounded-md overflow-hidden border">
                                        <MapComponent
                                            position={[addressForm.location.lat, addressForm.location.lng]}
                                            setPosition={handleMapClick}
                                        />
                                    </div>
                                    <button
                                        onClick={handleDetectLocation}
                                        className="mt-2 text-sm text-primary flex items-center gap-1 font-medium hover:underline"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                        Detect Current Location
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Apartment/Building</label>
                                        <input
                                            type="text"
                                            value={addressForm.apartment}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, apartment: e.target.value }))}
                                            className="w-full p-2 border rounded-md"
                                            placeholder="Flat No, Building"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Street/Gali No.</label>
                                        <input
                                            type="text"
                                            value={addressForm.street}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                                            className="w-full p-2 border rounded-md"
                                            placeholder="St No, Area"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Address</label>
                                    <textarea
                                        value={addressForm.fullAddress}
                                        onChange={(e) => setAddressForm(prev => ({ ...prev, fullAddress: e.target.value }))}
                                        className="w-full p-2 border rounded-md min-h-[80px]"
                                        placeholder="Complete address details..."
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowAddressModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAddress}
                                    disabled={savingAddress}
                                    className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70"
                                >
                                    {savingAddress ? 'Saving...' : 'Save Address'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
