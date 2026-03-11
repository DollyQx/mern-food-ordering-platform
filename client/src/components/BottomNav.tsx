'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useCart } from "@/context/CartContext";

import { useEffect, useState } from "react";

export function BottomNav() {
    const pathname = usePathname();
    const { state } = useCart();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, []);

    const cartCount = state.items.reduce((acc, item) => acc + item.quantity, 0);

    const navs = [
        {
            href: "/", label: "Home", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            )
        },
        {
            href: "/menu", label: "Menu", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
            )
        },
        {
            href: "/cart", label: "Cart", icon: (
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                            {cartCount}
                        </span>
                    )}
                </div>
            )
        },
        // Admin Link - Only specific check
        ...(user?.role === 'admin' ? [{
            href: "/admin/", label: "Admin", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" /></svg>
            )
        }] : []),
        {
            href: user ? "/dashboard" : "/login", label: user ? "Account" : "Login", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            )
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
            <nav className="flex items-center justify-around h-16">
                {navs.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                            "flex flex-col items-center justify-center w-full h-full space-y-1",
                            pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        {item.icon}
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
