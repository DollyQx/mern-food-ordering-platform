'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
    {
        href: "/admin",
        label: "Overview",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
    },
    {
        href: "/admin/orders",
        label: "Orders",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
    },
    {
        href: "/admin/menu",
        label: "Menu Management",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
    },
    {
        href: "/admin/settings",
        label: "Settings",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
    },
];

interface AdminSidebarProps {
    className?: string;
    onNavigate?: () => void;
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <nav className={clsx("w-64 border-r bg-zinc-900 text-zinc-300 h-full flex flex-col border-zinc-800", className)}>
            <div className="flex h-14 items-center border-b border-zinc-800 px-4 shrink-0">
                <Link className="font-bold text-lg text-white tracking-tight" href="/admin">
                    Zomoggy Admin
                </Link>
            </div>
            <div className="flex-1 py-4 overflow-y-auto">
                <ul className="grid gap-1 px-2">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                className={clsx(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 font-medium",
                                    pathname === item.href
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-4 border-t border-zinc-800 mt-auto">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white border border-zinc-700">
                        A
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">Admin</p>
                        <p className="text-xs text-zinc-500">Manager</p>
                    </div>
                </div>
            </div>
        </nav>
    );
}
