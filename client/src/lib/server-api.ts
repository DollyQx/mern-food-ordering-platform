
// Simple server-side fetcher
// We avoid axios here to keep it lightweight and use Next.js's native fetch caching capabilities if needed.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.includes('localhost')
    ? process.env.NEXT_PUBLIC_API_URL.replace('localhost', '127.0.0.1')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api');

export async function fetchCategories() {
    try {
        const res = await fetch(`${BASE_URL}/menu/categories`, {
            next: { revalidate: 0 }
        });
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        return Array.isArray(data) ? data : (data.categories || []);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export async function fetchFeaturedItems() {
    try {
        const res = await fetch(`${BASE_URL}/menu/items`, {
            next: { revalidate: 0 }
        });
        if (!res.ok) throw new Error('Failed to fetch items');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        return items.slice(0, 8); // Return first 8 items
    } catch (error) {
        console.error('Error fetching featured items:', error);
        return [];
    }
}
