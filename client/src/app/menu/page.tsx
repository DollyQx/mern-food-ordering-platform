import { Suspense } from 'react';
import MenuClient from './MenuClient';
import { MenuSkeleton } from '@/components/ui/MenuSkeleton';

export const dynamic = 'force-dynamic';

async function getData() {
    // SSR needs absolute URL. Use 127.0.0.1 to avoid Node v17+ IPv6 localhost issues.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.includes('localhost')
        ? process.env.NEXT_PUBLIC_API_URL.replace('localhost', '127.0.0.1')
        : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api');

    try {
        const [itemsRes, categoriesRes] = await Promise.all([
            fetch(`${apiUrl}/menu/items`, { cache: 'no-store' }),
            fetch(`${apiUrl}/menu/categories`, { cache: 'no-store' })
        ]);

        if (!itemsRes.ok) throw new Error('Failed to fetch items');
        if (!categoriesRes.ok) throw new Error('Failed to fetch categories');

        const items = await itemsRes.json();
        const categories = await categoriesRes.json();

        return { items, categories };
    } catch (error) {
        console.error("SSR Fetch Error:", error);
        return { items: [], categories: [] };
    }
}

export default async function MenuPage() {
    const { items, categories } = await getData();

    return (
        <Suspense fallback={<MenuSkeleton />}>
            <MenuClient initialItems={items} initialCategories={categories} />
        </Suspense>
    );
}

