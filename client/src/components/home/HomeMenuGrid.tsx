'use client';

import { MenuItemCard } from "@/components/MenuItemCard";
import { motion } from "framer-motion";
import { isCategoryAvailable, CategoryAvailability } from "@/lib/availability-utils";

// Define the interface locally or import types
interface Category extends CategoryAvailability {
    _id: string;
    name: string;
    isLongDistance?: boolean;
}

interface MenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    image?: string;
    isVeg: boolean;
    variants?: { name: string; price: number }[];
    category: Category;
}

export function HomeMenuGrid({ items, categories }: { items: MenuItem[], categories: Category[] }) {
    return (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.isArray(items) && items.map((item, index) => {
                // Robust check: Lookup category from the full categories list
                // Item.category might be an object (populated) or string (ID) depending on fetch depth/type
                // We cast to unknown to handle both for ID extraction
                const catRef = item.category as any;
                const categoryId = catRef?._id || catRef;

                const fullCategory = categories?.find(c => c._id === categoryId);
                const catToCheck = fullCategory || (typeof item.category === 'object' ? item.category : null);

                const isAvailable = isCategoryAvailable(catToCheck);

                return (
                    <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index }}
                    >
                        <MenuItemCard
                            item={{ ...item, priority: index < 4 }}
                            disabled={!isAvailable}
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
