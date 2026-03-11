'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import api from '@/lib/api'; // Add API import

import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const { socket } = useSocket();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Native Bridge for Android FCM
    useEffect(() => {
        if (authorized) {
            // Define global function for Android to call
            (window as any).receiveFcmToken = async (token: string) => {
                if (token) {
                    try {
                        await api.post('/notifications/fcm-token', { token });
                        console.log("Native FCM Token Synced");
                    } catch (e) {
                        console.error("Failed to sync Native Token", e);
                    }
                }
            };
        }
    }, [authorized]);

    const subscribeToPush = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const register = await navigator.serviceWorker.register('/sw.js');

                // Convert VAPID Public Key to Uint8Array
                const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!publicVapidKey) return console.error("No VAPID Public Key found");

                const urlBase64ToUint8Array = (base64String: string) => {
                    const padding = '='.repeat((4 - base64String.length % 4) % 4);
                    const base64 = (base64String + padding)
                        .replace(/-/g, '+')
                        .replace(/_/g, '/');
                    const rawData = window.atob(base64);
                    const outputArray = new Uint8Array(rawData.length);
                    for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                    }
                    return outputArray;
                };

                const subscription = await register.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                });

                await api.post('/notifications/subscribe', subscription);
                console.log('Push Subscribed');
            } catch (error) {
                console.error("Push Subscription Failed", error);
            }
        }
    };

    useEffect(() => {
        if (authorized) {
            subscribeToPush();
        }
    }, [authorized]);

    // Initialize Audio object once to allow "unlocking" on mobile
    useEffect(() => {
        audioRef.current = new Audio('/sounds/order.mp3');
        audioRef.current.loop = true;

        const unlockAudio = () => {
            if (audioRef.current) {
                // Play and immediately pause to "bless" the audio element for iOS/Android
                const promise = audioRef.current.play();
                if (promise !== undefined) {
                    promise.then(() => {
                        audioRef.current?.pause();
                        audioRef.current!.currentTime = 0;
                    }).catch(error => console.log("Audio permission pending...", error));
                }
            }
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
    }, []);

    const stopSound = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const handleOrderAction = async (orderId: string, action: 'accept' | 'reject', toastId: string | number) => {
        stopSound();
        toast.dismiss(toastId);
        try {
            const status = action === 'accept' ? 'Preparing' : 'Cancelled';
            await api.put(`/admin/order/${orderId}`, { status });
            toast.success(`Order ${action === 'accept' ? 'Accepted' : 'Rejected'}`);
            router.push('/admin/orders'); // Ensure we are on the page to see update
        } catch (error) {
            console.error("Action failed", error);
            toast.error("Failed to update order");
        }
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('newOrder', (data) => {
            // Priority 1: Native Android Sound (Best for App)
            if ((window as any).AndroidApp && (window as any).AndroidApp.playAlertSound) {
                (window as any).AndroidApp.playAlertSound();
                toast.success("Native Sound Triggered");
            }
            // Priority 2: Web Audio (Best for Desktop/Chrome)
            else {
                try {
                    if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.loop = true;
                        audioRef.current.play().catch(e => {
                            console.error("Audio play failed", e);
                            toast.error("Click anywhere to enable sound!");
                        });
                    }
                } catch (e) {
                    console.error("Audio error", e);
                }
            }

            // Show Actionable Toast
            toast.custom((t) => (
                <div className="bg-card border rounded-lg shadow-lg p-4 w-full max-w-sm pointer-events-auto flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg">New Order Received!</h3>
                            <p className="text-sm text-muted-foreground">Order #{data._id.slice(-6).toUpperCase()}</p>
                            <p className="font-bold mt-1">₹{data.totalAmount}</p>
                        </div>
                        <button onClick={() => { stopSound(); toast.dismiss(t); }} className="text-muted-foreground hover:text-foreground">
                            ✕
                        </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => handleOrderAction(data._id, 'accept', t)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md font-medium text-sm transition-colors"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => handleOrderAction(data._id, 'reject', t)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md font-medium text-sm transition-colors"
                        >
                            Reject
                        </button>
                    </div>
                    <button
                        onClick={() => { stopSound(); toast.dismiss(t); router.push('/admin/orders'); }}
                        className="text-xs text-center text-blue-500 hover:underline w-full"
                    >
                        View Details
                    </button>
                </div>
            ), { duration: Infinity }); // Stay until action
        });

        // Listen for Order Cancellations
        socket.on('orderCancelled', (order) => {
            // Play Sound (Same as new order for attention)
            try {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.loop = true;
                    audioRef.current.play().catch(e => console.error(e));
                }
            } catch (e) {
                console.error("Audio error", e);
            }

            toast.custom((t) => (
                <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 w-full max-w-sm pointer-events-auto flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-red-700">Order Cancelled</h3>
                            <p className="text-sm text-red-600">Order #{order._id.slice(-6).toUpperCase()}</p>
                            <p className="text-xs text-red-500 mt-1">Reason: {order.cancellationReason}</p>
                        </div>
                        <button onClick={() => { stopSound(); toast.dismiss(t); }} className="text-red-500 hover:text-red-700">✕</button>
                    </div>
                    <button
                        onClick={() => { stopSound(); toast.dismiss(t); router.push('/admin/orders'); }}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md font-medium text-sm transition-colors w-full"
                    >
                        View Orders
                    </button>
                </div>
            ), { duration: Infinity });
        });

        return () => {
            socket.off('newOrder');
            socket.off('orderCancelled');
            stopSound(); // Cleanup on unmount
        };
    }, [socket, router]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/login');
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'admin') {
                alert("Unauthorized: Admin Access Only");
                router.push('/');
                return;
            }
            setAuthorized(true);

            // Explicitly join admin room upon successful auth check
            if (socket) {
                console.log("AdminLayout: Joining admin_notifications room");
                socket.emit('join_admin_room');
            }
        } catch (e) {
            router.push('/login');
        }
    }, [router, socket]);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!authorized) {
        return <div className="flex h-screen items-center justify-center">Checking authorization...</div>;
    }

    return (
        <div className="flex min-h-screen w-full flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <AdminSidebar className="hidden md:block" />

            {/* Mobile Header & Sidebar Overlay */}
            <div className={`fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)}>
                <div className={`absolute left-0 top-0 h-full bg-card transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
                    <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} />
                </div>
            </div>

            <main className="flex-1 p-0 md:p-6 relative">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b bg-zinc-950 text-white sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 -ml-2 rounded-md hover:bg-zinc-800 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
                        </button>
                        <span className="font-bold text-lg tracking-tight">Admin Panel</span>
                    </div>
                </div>

                {/* Content Wrapper */}
                <div className="p-4 md:p-0">
                    {children}
                </div>

                {/* Debug Sound Button (Desktop Only or Discreet) */}
                <button
                    onClick={() => {
                        if (audioRef.current) audioRef.current.pause();
                        audioRef.current = new Audio('/sounds/order.mp3');
                        audioRef.current.loop = true;
                        audioRef.current.play().catch(e => toast.error("Audio failed"));
                        toast.info("Testing Sound... Click Accept/Reject or Refresh to stop", {
                            action: { label: 'Stop', onClick: () => stopSound() }
                        });
                    }}
                    className="hidden md:block absolute top-2 right-2 text-xs bg-muted px-2 py-1 rounded border opacity-50 hover:opacity-100"
                >
                    Test Sound
                </button>
            </main>
        </div>
    );
}
