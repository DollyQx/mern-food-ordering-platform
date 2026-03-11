'use client';

import { useCart } from "@/context/CartContext";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";
import { getImageUrl } from "@/lib/image-utils";

import { checkDeliverability } from "@/lib/availability-utils";
import LocationModal from "./LocationModal";

interface MenuItemProps {
    _id: string;
    name: string;
    description: string;
    price: number;
    image?: string;
    isVeg: boolean;
    variants?: { name: string; price: number }[];
    priority?: boolean;
    category?: { _id: string; name: string; isLongDistance?: boolean } | string;
}

export function MenuItemCard({ item, priority = false, disabled = false }: { item: MenuItemProps, priority?: boolean, disabled?: boolean }) {
    const { state, addItem, removeOneItem } = useCart();
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Delivery Validation
    // If category is string (ID), we assume standard delivery or fallback to safe. 
    // Ideally it should be populated.
    const isLongDistance = typeof item.category === 'object' ? item.category?.isLongDistance : false;
    const deliveryStatus = checkDeliverability(state.pincode || '', isLongDistance);

    // If no pincode set, we allow viewing but adding will prompt.
    // If pincode set and invalid, we block.
    const isDeliverable = !state.pincode || deliveryStatus.available;

    const [selectedVariant, setSelectedVariant] = useState(
        item.variants && item.variants.length > 0 ? item.variants[0] : null
    );

    // ... (useEffect for variant sync omitted, kept same)

    const currentPrice = selectedVariant ? selectedVariant.price : item.price;

    // ... (quantity finding logic omitted, kept same)
    const cartItem = state.items.find(
        (i) => i._id === item._id && i.variant?.name === selectedVariant?.name
    );
    const quantity = cartItem ? cartItem.quantity : 0;


    const handleAdd = () => {
        if (!state.pincode) {
            setShowLocationModal(true);
            return;
        }

        if (!isDeliverable) {
            toast.error(deliveryStatus.reason || "Not available at your location");
            return;
        }

        if (quantity === 0) {
            toast.success(`${item.name} added to cart`, {
                position: 'bottom-center',
                duration: 2000
            });
        }

        addItem({
            _id: item._id,
            name: item.name,
            price: currentPrice,
            image: item.image,
            category: item.category,
            variant: selectedVariant ? { name: selectedVariant.name, price: selectedVariant.price } : undefined,
            isLongDistance: isLongDistance,
            isFreeGift: false,
            quantity: 1
        });
    };

    const handleRemove = () => {
        if (quantity > 0) {
            removeOneItem({
                _id: item._id,
                variant: selectedVariant ? { name: selectedVariant.name } : undefined
            });
            toast.success("Item removed from cart");
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className={`group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-md transition-all hover:shadow-xl ${disabled || !isDeliverable ? 'opacity-60 grayscale pointer-events-none' : ''}`}
            >
                <div className="aspect-video w-full overflow-hidden bg-muted relative">
                    {/* Image Logic ... */}
                    {item.image ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={getImageUrl(item.image)}
                                alt={item.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                priority={priority || false}
                            />
                        </div>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                            No Image
                        </div>
                    )}
                    {disabled && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10">
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md transform -rotate-12">
                                Not Available
                            </span>
                        </div>
                    )}
                    {!disabled && !isDeliverable && state.pincode && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 p-2 text-center">
                            <span className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md">
                                Not deliverable to {state.pincode}
                            </span>
                        </div>
                    )}
                </div>
                {/* ... Rest of component ... */}
                <div className="flex flex-1 flex-col p-2 sm:p-4">
                    <div className="flex items-start justify-between gap-1">
                        <h3 className="font-semibold text-sm sm:text-lg leading-tight line-clamp-2">{item.name}</h3>
                        <span className={clsx("text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap", item.isVeg ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                            {item.isVeg ? "VEG" : "NON-VEG"}
                        </span>
                    </div>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">{item.description}</p>

                    {/* Variant Selector */}
                    {item.variants && item.variants.length > 0 && (
                        <div className="mt-2 text-xs">
                            <select
                                value={selectedVariant?.name}
                                onChange={(e) => {
                                    const v = item.variants?.find(v => v.name === e.target.value);
                                    if (v) setSelectedVariant(v);
                                }}
                                className="w-full p-1 border rounded bg-muted/50 focus:ring-1 focus:ring-primary"
                            >
                                {item.variants.map(v => (
                                    <option key={v.name} value={v.name}>{v.name} - ₹{v.price}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2 sm:pt-4 h-12">
                        <span className="font-bold text-sm sm:text-lg">₹{currentPrice}</span>

                        {quantity === 0 ? (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAdd}
                                className="rounded-md bg-primary px-4 py-1.5 text-xs sm:text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm"
                            >
                                ADD
                            </motion.button>
                        ) : (
                            <div className="flex items-center bg-primary/10 rounded-md h-8">
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={handleRemove}
                                    className="w-8 h-full flex items-center justify-center text-primary font-bold hover:bg-primary/20 rounded-l-md transition-colors text-lg pb-1"
                                >
                                    -
                                </motion.button>
                                <span className="font-bold text-primary w-6 text-center text-sm">{quantity}</span>
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={handleAdd}
                                    className="w-8 h-full flex items-center justify-center text-primary font-bold hover:bg-primary/20 rounded-r-md transition-colors text-lg pb-1"
                                >
                                    +
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
            <LocationModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />
        </>
    );
}
