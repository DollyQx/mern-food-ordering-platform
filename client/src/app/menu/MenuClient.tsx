'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MenuItemCard } from '@/components/MenuItemCard';
import { isCategoryAvailable, CategoryAvailability } from "@/lib/availability-utils";
import { motion, AnimatePresence } from "framer-motion";

interface Category extends CategoryAvailability {
    _id: string;
    name: string;
    image?: string;
    subCategories?: string[];
}

interface MenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: { _id: string; name: string }; // Populated
    subCategory?: string;
    image?: string;
    isVeg: boolean;
    variants?: { name: string; price: number }[];
}

interface MenuClientProps {
    initialItems: MenuItem[];
    initialCategories: Category[];
}

export default function MenuClient({ initialItems, initialCategories }: MenuClientProps) {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';

    // Initialize state (prefer search query over category if both exist, simpler UX)
    const [selectedCategory, setSelectedCategory] = useState<string>(
        searchQuery ? 'All' : (searchParams.get('category') || 'All')
    );
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
    const [showVegOnly, setShowVegOnly] = useState(false);

    // Sync state with URL params
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            setSelectedCategory(categoryParam.trim());
        } else if (!searchQuery) {
            // Only reset if no search query (because search query forces All)
            setSelectedCategory('All');
        }
    }, [searchParams, searchQuery]);

    // Derived state for hydration mismatch prevention
    if (!isMounted) {
        // Optional: return null or a loader if hydration matches are critical, 
        // but for this simple filter it's usually fine to render matching the server query
    }

    // Memoized Filtering Logic
    const sortedItems = useMemo(() => initialItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery) || item.description.toLowerCase().includes(searchQuery);

        // If searching, ignore category filter unless explicitly set by user interaction (which we don't track deeply here, so we'll make search global by default)
        // Actually, a better UX is: Global Search if query exists.
        if (searchQuery) {
            const matchesVeg = showVegOnly ? item.isVeg : true;
            return matchesSearch && matchesVeg;
        }

        const matchesCategory = selectedCategory === 'All' ||
            (typeof item.category === 'string' ? item.category === selectedCategory : item.category._id === selectedCategory);
        const matchesSubCategory = selectedSubCategory === 'All' || item.subCategory === selectedSubCategory;
        const matchesVeg = showVegOnly ? item.isVeg : true;

        return matchesCategory && matchesSubCategory && matchesVeg;
    }), [initialItems, selectedCategory, selectedSubCategory, searchQuery, showVegOnly]);

    const filteredItems = sortedItems;

    // Helper to constructing image url (if needed for categories, items handle it themselves via MenuItemCard)
    const getImageUrl = (path: string | undefined) => {
        if (!path) return '';
        if (path.includes('res.cloudinary.com')) return path; // Optimization: Raw Cloudinary URL
        if (path.startsWith('http')) return path;
        return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${path}`;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="container pb-20 px-4 mx-auto max-w-7xl min-h-screen">
            <div className="flex flex-col items-center justify-center py-8 gap-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-center">Our Menu</h1>

                <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-full border">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full transition-colors cursor-pointer ${!showVegOnly ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => setShowVegOnly(false)}>All</span>
                    <button
                        onClick={() => setShowVegOnly(!showVegOnly)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${showVegOnly ? 'bg-green-600' : 'bg-gray-200'}`}
                    >
                        <span className={`${showVegOnly ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </button>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full transition-colors cursor-pointer ${showVegOnly ? 'bg-green-100 text-green-800 font-bold' : 'text-muted-foreground'}`} onClick={() => setShowVegOnly(true)}>Veg Only</span>
                </div>
            </div>

            {/* Sticky Navigation Header */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-2 border-b mb-6 transition-all shadow-sm">
                {/* Category Carousel */}
                <div className="overflow-x-auto pb-2 hide-scrollbar">
                    <div className="flex gap-4 min-w-max px-2">
                        <button
                            onClick={() => {
                                setSelectedCategory('All');
                                setSelectedSubCategory('All');
                            }}
                            className={`flex flex-col items-center gap-2 group min-w-[80px] sm:min-w-[100px]`}
                        >
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 transition-all overflow-hidden ${selectedCategory === 'All' ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-muted hover:border-primary/50'
                                }`}>
                                <span className="text-lg sm:text-2xl font-bold text-gray-400 group-hover:text-primary">ALL</span>
                            </div>
                            <span className={`text-xs sm:text-sm font-medium ${selectedCategory === 'All' ? 'text-primary' : 'text-muted-foreground'}`}>All Items</span>
                        </button>

                        {initialCategories.map((cat) => {
                            const available = isCategoryAvailable(cat);
                            return (
                                <button
                                    key={cat._id}
                                    onClick={() => {
                                        setSelectedCategory(cat._id);
                                        setSelectedSubCategory('All');
                                    }}
                                    className={`flex flex-col items-center gap-2 group min-w-[80px] sm:min-w-[100px] ${!available ? 'opacity-70' : ''}`}
                                >
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 transition-all relative overflow-hidden bg-muted ${selectedCategory === cat._id ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-muted hover:border-primary/50'} ${!available ? 'grayscale border-red-200' : ''}`}>
                                        {cat.image ? (
                                            <img
                                                src={getImageUrl(cat.image)}
                                                alt={cat.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/150?text=' + cat.name.charAt(0);
                                                    (e.target as HTMLImageElement).style.objectFit = 'cover';
                                                }}
                                            />
                                        ) : (
                                            <span className="text-xl font-bold text-gray-400 group-hover:text-primary">{cat.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <span className={`text-xs sm:text-sm font-medium truncate max-w-[90px] ${selectedCategory === cat._id ? 'text-primary' : 'text-muted-foreground'}`}>{cat.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sub-Category Carousel (Conditional) */}
                {selectedCategory !== 'All' && !searchQuery && (() => {
                    const currentCat = initialCategories.find(c => c._id === selectedCategory);
                    if (currentCat && currentCat.subCategories && currentCat.subCategories.length > 0) {
                        return (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="overflow-x-auto pt-2 pb-1 hide-scrollbar border-t mt-2"
                            >
                                <div className="flex gap-2 min-w-max px-1">
                                    <button
                                        onClick={() => setSelectedSubCategory('All')}
                                        className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors border ${selectedSubCategory === 'All'
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-background text-foreground border-muted hover:border-primary/50'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {currentCat.subCategories.map((sub, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedSubCategory(sub)}
                                            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors border ${selectedSubCategory === sub
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-background text-foreground border-muted hover:border-primary/50'
                                                }`}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    }
                    return null;
                })()}
            </div>

            {/* Menu Grid / Sections */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedCategory + selectedSubCategory + searchQuery}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                    {searchQuery ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h2 className="text-2xl font-bold text-foreground">
                                    Search Results for "{searchQuery}"
                                </h2>
                                <span className="text-muted-foreground font-medium">{filteredItems.length} items found</span>
                            </div>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredItems.map((item) => {
                                    const categoryId = typeof item.category === 'string' ? item.category : item.category._id;
                                    const fullCategory = initialCategories.find(c => c._id === categoryId);
                                    const catToCheck = (fullCategory || item.category) as unknown as Category;
                                    const isAvailable = isCategoryAvailable(catToCheck);

                                    return (
                                        <motion.div key={item._id} variants={itemVariants}>
                                            <MenuItemCard item={item} disabled={!isAvailable} />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : selectedCategory !== 'All' && selectedSubCategory === 'All' && initialCategories.find(c => c._id === selectedCategory)?.subCategories?.length ? (
                        <div className="space-y-12">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h2 className="text-3xl font-bold text-primary">
                                    {initialCategories.find(c => c._id === selectedCategory)?.name}
                                </h2>
                                <span className="text-muted-foreground font-medium">{filteredItems.length} items</span>
                            </div>

                            {initialCategories.find(c => c._id === selectedCategory)?.subCategories?.map((subCat) => {
                                const subCatItems = filteredItems.filter(item => item.subCategory === subCat);
                                if (subCatItems.length === 0) return null;

                                return (
                                    <div key={subCat} className="space-y-4">
                                        <h3 className="text-xl font-bold text-foreground/80 flex items-center gap-2">
                                            <span className="w-1 h-6 bg-primary rounded-full"></span>
                                            {subCat}
                                        </h3>
                                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {subCatItems.map((item) => {
                                                const categoryId = typeof item.category === 'string' ? item.category : item.category._id;
                                                const fullCategory = initialCategories.find(c => c._id === categoryId);
                                                const catToCheck = (fullCategory || item.category) as unknown as Category;
                                                const isAvailable = isCategoryAvailable(catToCheck);

                                                return (
                                                    <motion.div key={item._id} variants={itemVariants}>
                                                        <MenuItemCard item={item} disabled={!isAvailable} />
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {(() => {
                                const currentCatStrings = initialCategories.find(c => c._id === selectedCategory)?.subCategories || [];
                                const otherItems = filteredItems.filter(item => !item.subCategory || !currentCatStrings.includes(item.subCategory));
                                if (otherItems.length === 0) return null;

                                return (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-foreground/80 flex items-center gap-2">
                                            <span className="w-1 h-6 bg-primary rounded-full"></span>
                                            Others
                                        </h3>
                                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {otherItems.map((item) => {
                                                const categoryId = typeof item.category === 'string' ? item.category : item.category._id;
                                                const fullCategory = initialCategories.find(c => c._id === categoryId);
                                                const catToCheck = (fullCategory || item.category) as unknown as Category;
                                                const isAvailable = isCategoryAvailable(catToCheck);

                                                return (
                                                    <motion.div key={item._id} variants={itemVariants}>
                                                        <MenuItemCard item={item} disabled={!isAvailable} />
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div>
                            {!searchQuery && (
                                <h2 className="text-2xl font-bold mb-6 border-l-4 border-primary pl-4">
                                    {selectedCategory === 'All' ? 'All Items' : initialCategories.find(c => c._id === selectedCategory)?.name || 'Items'}
                                </h2>
                            )}
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredItems.map((item) => {
                                    const categoryId = typeof item.category === 'string' ? item.category : item.category._id;
                                    const fullCategory = initialCategories.find(c => c._id === categoryId);
                                    const catToCheck = (fullCategory || item.category) as unknown as Category;
                                    const isAvailable = isCategoryAvailable(catToCheck);

                                    return (
                                        <motion.div key={item._id} variants={itemVariants}>
                                            <MenuItemCard item={item} disabled={!isAvailable} />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {filteredItems.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 text-muted-foreground bg-muted/20 rounded-lg mt-8"
                >
                    <p className="text-lg">No items found matching your criteria.</p>
                </motion.div>
            )}
        </div>
    );
}
