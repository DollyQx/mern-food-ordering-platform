'use client';

// import { useEffect, useState } from 'react'; // Removed
// import api from '@/lib/api'; // Removed
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { getImageUrl } from "@/lib/image-utils";
import { isCategoryAvailable, CategoryAvailability } from "@/lib/availability-utils";

interface Category extends CategoryAvailability {
    _id: string;
    name: string;
    image?: string;
}

export function CategoryCarousel({ categories }: { categories: Category[] }) {
    const router = useRouter();

    if (!categories || !Array.isArray(categories) || categories.length === 0) return null;

    return (
        <div className="w-full py-6">
            <h2 className="mb-4 text-xl font-bold px-4">What's on your mind?</h2>
            <div className="overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex w-max space-x-4 px-4">
                    {categories.map((cat) => {
                        const available = isCategoryAvailable(cat);
                        return (
                            <div
                                key={cat._id}
                                onClick={() => available && router.push(`/menu?category=${cat._id}`)}
                                className={`flex flex-col items-center gap-2 group cursor-pointer transition-all ${!available ? 'opacity-60 grayscale pointer-events-none' : 'hover:scale-105'
                                    }`}
                            >
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-muted relative">
                                    {cat.image ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={getImageUrl(cat.image)}
                                                alt={cat.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                                            {cat.name[0]}
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-medium">{cat.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
