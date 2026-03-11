'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { useEffect } from 'react';
import api from '@/lib/api';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Exclude Navbar/BottomNav from Admin routes
    // Also optionally exclude from Login/Signup/Checkout if desired, but User said "jis jis page me hona chahiye"
    // Usually Login/Signup have minimal nav. 
    // But let's keep them for consistency unless it looks bad.
    // Admin ABSOLUTELY needs exclusion because it has its own sidebar.

    const isAdmin = pathname?.startsWith('/admin');

    useEffect(() => {
        // 1. Android Native Bridge Handler
        // The Android app calls this function when it gets a new FCM token
        (window as any).receiveFcmToken = async (token: string) => {
            try {
                // Ensure user is logged in before sending token
                const authToken = localStorage.getItem('token');
                if (!authToken) {
                    console.log('Skipping FCM Token Sync: User not logged in');
                    return;
                }

                // We can check localStorage or similar. api interceptor handles token attachment
                await api.post('/notifications/fcm-token', { token });
                console.log('✅ FCM Token Synced with Server');
            } catch (e) {
                console.error('❌ Failed to sync FCM token', e);
            }
        };

        // 2. Web Push Permission (Desktop/PWA)
        // Only ask if not on Android (Android handles its own permission via Native)
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (!isAndroid && 'Notification' in window) {
            if (Notification.permission === 'default') {
                // Ask after a delay to not be annoying
                setTimeout(() => {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            console.log('Notification permission granted.');
                            // TODO: Subscribe to Web Push here using Service Worker if needed
                            // For now, at least we have permission for Foreground SW notifications
                        }
                    });
                }, 5000);
            }
        }
    }, []);

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pb-16 md:pb-0">
                {children}
            </main>
            <div className="md:hidden">
                <BottomNav />
            </div>
        </>
    );
}
