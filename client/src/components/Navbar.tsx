'use client';

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { clsx } from "clsx";
import Image from "next/image";
import LocationModal from "./LocationModal";

export function Navbar() {
    const { state } = useCart();
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [locationModalOpen, setLocationModalOpen] = useState(false);

    // Hydration fix: cartCount may differ between server (0) and client (localStorage)
    // We only show cart count after mount
    const cartCount = (state?.items || []).reduce((acc, item) => acc + (item.quantity || 0), 0);

    useEffect(() => {
        setMounted(true);
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
        router.refresh();
    };

    // REMOVED: if (!mounted) return null; 
    // This allows the Logo and Header structure to render on the Server (SSR), fixing CLS and LCP.

    const handleShare = async () => {
        const title = "Download Zomoggy App & Order Online!";
        // Share Play Store Link so users can download the app (or open it if installed)
        const shareUrl = "https://play.google.com/store/apps/details?id=com.Bakery.zomoggy&pcampaignid=web_share";
        const shareText = "Order delicious cakes and snacks from Zomoggy! Download the App now:";

        // 1. Android Native Share
        // @ts-ignore
        if (typeof window !== 'undefined' && window.AndroidApp && window.AndroidApp.shareContent) {
            // @ts-ignore
            window.AndroidApp.shareContent(shareText, shareUrl);
            return;
        }

        // 2. Web Share API (Mobile Browsers)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: shareText,
                    url: shareUrl
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
            return;
        }

        // 3. Fallback: Copy to Clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert("Link copied to clipboard!");
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-zinc-950 shadow-md text-white">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between mx-auto px-2 md:px-8">
                <div className="mr-1 md:mr-8 flex items-center">
                    <Link className="mr-6 flex items-center space-x-2" href="/">
                        <Image src="/logo.png" alt="Zomoggy" width={120} height={40} className="object-contain h-8 w-auto md:h-10 filter drop-shadow-sm" priority />
                    </Link>
                </div>

                {/* Location Selector */}
                {mounted && (
                    <button
                        onClick={() => setLocationModalOpen(true)}
                        className="flex items-center gap-1.5 mr-auto md:mr-4 hover:bg-zinc-900 p-1.5 md:p-2 rounded-xl transition-all active:scale-95 group"
                    >
                        <div className="bg-zinc-800/50 p-1.5 rounded-full group-hover:bg-primary/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary w-4 h-4 md:w-5 md:h-5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mb-0.5">Delivering to</span>
                            <div className="flex items-center gap-1">
                                <span className="text-sm md:text-base font-bold text-white max-w-[120px] md:max-w-[200px] truncate leading-none">
                                    {state.pincode || "Select Location"}
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-white transition-colors w-3 h-3 md:w-4 md:h-4"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </button>
                )}

                {/* Search Bar - Desktop: Inline, Mobile: Hidden (moved below) */}
                <div className="hidden md:block flex-1 max-w-md mx-4">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const query = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
                        if (query.trim()) router.push(`/menu?search=${encodeURIComponent(query)}`);
                    }} className="relative">
                        <input
                            type="text"
                            name="search"
                            placeholder="Search for food..."
                            className="w-full px-4 py-2 rounded-full border border-gray-700 bg-zinc-900 text-gray-200 placeholder:text-gray-500 focus:ring-2 ring-primary focus:outline-none text-sm shadow-sm transition-all"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </button>
                    </form>
                </div>

                <div className="flex items-center justify-end space-x-1 md:space-x-4">
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium mr-4">
                        <Link href="/menu" className="transition-colors text-white/90 hover:text-white hover:underline decoration-2 underline-offset-4">
                            Menu
                        </Link>
                        {/* Only show Admin link if mounted and user is admin to avoid mismatch */}
                        {mounted && user && user.role === 'admin' && (
                            <Link href="/admin" className="text-white/90 hover:text-white">
                                Admin
                            </Link>
                        )}
                    </nav>
                    <nav className="flex items-center space-x-2 md:space-x-3">
                        <button onClick={handleShare} className="relative group p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all" title="Share App">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
                        </button>
                        <Link href="/cart" className="relative group p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag w-5 h-5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                            {/* Only show badge after mount to prevent hydration error */}
                            {mounted && cartCount > 0 && (
                                <span className="absolute top-0 right-0 mt-0 mr-0 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary shadow-sm border border-primary/20">
                                    {cartCount}
                                </span>
                            )}
                            <span className="sr-only">Cart</span>
                        </Link>

                        {/* User Profile / Login - Wait for mount */}
                        {mounted ? (
                            user ? (
                                <div className="flex items-center gap-2 md:gap-3 border-l border-white/20 pl-2 md:pl-4 ml-1 md:ml-2">
                                    <Link href="/dashboard" className="text-sm font-bold hidden sm:inline-block hover:text-white text-white/90 transition-colors">
                                        Hi, {user?.name ? user.name.split(' ')[0] : 'User'}
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-xs bg-white text-primary px-3 py-1.5 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-sm"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link href="/login" className="text-sm font-bold bg-white text-primary px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors shadow-sm">
                                    Login
                                </Link>
                            )
                        ) : (
                            // Placeholder used during SSR/Hydration to prevent layout shifts
                            <div className="w-16 h-8 bg-white/20 rounded-full animate-pulse"></div>
                        )}
                    </nav>
                </div>
            </div>

            {/* Search Bar - Mobile Only (Below Navbar) */}
            <div className="md:hidden container pb-3 px-3">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const query = (e.currentTarget.elements.namedItem('search-mobile') as HTMLInputElement).value;
                    if (query.trim()) router.push(`/menu?search=${encodeURIComponent(query)}`);
                }} className="relative">
                    <input
                        type="text"
                        name="search-mobile"
                        placeholder="Search for cakes, snacks..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-800 bg-zinc-900/80 text-gray-200 placeholder:text-gray-500 focus:ring-2 ring-primary focus:outline-none text-sm shadow-sm transition-all"
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </button>
                </form>
            </div>

            <LocationModal isOpen={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
        </header>
    );
}
