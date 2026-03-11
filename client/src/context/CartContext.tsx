'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '@/lib/api';

export interface CartItem {
    _id: string; // Menu Item ID
    name: string;
    price: number;
    quantity: number;
    variant?: { name: string; price: number };
    isFreeGift?: boolean;
    isLongDistance?: boolean;
    image?: string;
    category?: { _id: string; name: string; isLongDistance?: boolean } | string;
}

export interface CartSettings {
    deliveryFee: number;
    freeDeliveryThreshold: number;
    freeGiftThreshold: number;
    minOrderValue: number;
}

const DEFAULT_SETTINGS: CartSettings = {
    deliveryFee: 40,
    freeDeliveryThreshold: 300,
    freeGiftThreshold: 400,
    minOrderValue: 199
};

interface CartState {
    items: CartItem[];
    totalAmount: number;
    deliveryFee: number;
    settings: CartSettings;
    pincode?: string; // Current delivery location
}

type CartAction =
    | { type: 'ADD_ITEM'; payload: CartItem }
    | { type: 'REMOVE_ITEM'; payload: { _id: string; variant?: { name: string } } }
    | { type: 'REMOVE_ONE_ITEM'; payload: { _id: string; variant?: { name: string } } }
    | { type: 'CLEAR_CART' }
    | { type: 'SET_SETTINGS'; payload: CartSettings }
    | { type: 'SET_PINCODE'; payload: string };

const initialState: CartState = {
    items: [],
    totalAmount: 0,
    deliveryFee: 50,
    settings: DEFAULT_SETTINGS,
    pincode: undefined,
};

const FREE_GIFT_ID = 'free-250g-gujiya';

const FREE_ITEM: CartItem = {
    _id: FREE_GIFT_ID,
    name: 'Free 250g Gujiya',
    price: 0,
    quantity: 1,
    isFreeGift: true,
    variant: { name: 'Complimentary', price: 0 }
};

// Helper to determine Gujiya weight in KG from name/variant
const getGujiyaWeightInKg = (item: CartItem): number => {
    const isGujiya = item.name.toLowerCase().includes('gujiya') ||
        (item.category && typeof item.category === 'object' && item.category.name.toLowerCase().includes('gujiya'));

    if (!isGujiya) return 0;

    let totalKg = 0;
    const variantName = item.variant?.name?.toLowerCase() || '';
    const itemName = item.name.toLowerCase();
    const searchString = `${itemName} ${variantName}`;

    if (searchString.includes('2kg')) totalKg = 2;
    else if (searchString.includes('1kg')) totalKg = 1;
    else if (searchString.includes('500g') || searchString.includes('1/2kg')) totalKg = 0.5;
    else if (searchString.includes('250g')) totalKg = 0.25;

    return totalKg * item.quantity;
};

const calculateCartState = (items: CartItem[], settings: CartSettings, pincode?: string): CartState => {
    // 1. Separate paid items from possible existing free gifts
    const paidItems = items.filter(i => !i.isFreeGift && i._id !== FREE_GIFT_ID);

    // 2. Calculate Subtotal from paid items only
    const subtotal = paidItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // 3. Determine Delivery Fee
    const deliveryFee = subtotal > settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;

    // 4. Handle Free Gift Logic based on Gujiya weight
    let finalItems = [...paidItems];

    // Calculate total Gujiya weight in the cart
    const totalGujiyaWeightKg = paidItems.reduce((acc, item) => acc + getGujiyaWeightInKg(item), 0);

    // For every 2kg, give 1 free 250g Gujiya
    const freeGiftsCount = Math.floor(totalGujiyaWeightKg / 2);

    if (freeGiftsCount > 0) {
        finalItems.push({
            ...FREE_ITEM,
            quantity: freeGiftsCount
        });
    }

    return {
        items: finalItems,
        totalAmount: subtotal,
        deliveryFee,
        settings,
        pincode: pincode
    };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
    let newItems = [...state.items];
    let newSettings = state.settings;
    let newPincode = state.pincode;

    switch (action.type) {
        case 'ADD_ITEM': {
            const existingItemIndex = newItems.findIndex(
                (item) => item._id === action.payload._id && item.variant?.name === action.payload.variant?.name
            );

            if (existingItemIndex > -1) {
                // Ensure we don't modify free gifts or anything weird
                const item = newItems[existingItemIndex];
                if (!item.isFreeGift) {
                    newItems[existingItemIndex] = {
                        ...item,
                        quantity: item.quantity + action.payload.quantity
                    };
                }
            } else {
                newItems.push(action.payload);
            }
            break;
        }
        case 'REMOVE_ITEM': {
            newItems = newItems.filter(
                (item) => !(item._id === action.payload._id && item.variant?.name === action.payload.variant?.name)
            );
            break;
        }
        case 'REMOVE_ONE_ITEM': {
            const index = newItems.findIndex(
                (item) => item._id === action.payload._id && item.variant?.name === action.payload.variant?.name
            );

            if (index > -1) {
                if (newItems[index].quantity > 1) {
                    newItems[index].quantity -= 1;
                } else {
                    newItems.splice(index, 1);
                }
            }
            break;
        }
        case 'CLEAR_CART':
            // Reset to initial state but keep settings potentially? 
            // Better to return clean state with current settings.
            return {
                ...initialState,
                settings: state.settings,
                pincode: state.pincode // Keep pincode even on clear? User might want to keep location.
            };
        case 'SET_SETTINGS': {
            newSettings = action.payload;
            break;
        }
        case 'SET_PINCODE': {
            newPincode = action.payload;
            // Return immediately as this doesn't affect cart totals (unless we add delivery fee logic based on pincode later)
            // But for now, just updating state is fine, but we should probably run through calculateCartState just in case.
            // Actually, simply returning is safer to avoid circular logic if unrelated.
            return {
                ...state,
                pincode: newPincode
            };
        }
        default:
            return state;
    }

    return calculateCartState(newItems, newSettings, newPincode);
};

const CartContext = createContext<{
    state: CartState;
    addItem: (item: CartItem) => void;
    removeOneItem: (item: { _id: string; variant?: { name: string } }) => void;
    removeItem: (item: { _id: string; variant?: { name: string } }) => void;
    clearCart: () => void;
    refreshSettings: () => Promise<void>;
    setPincode: (code: string) => void;
}>({
    state: initialState,
    addItem: () => { },
    removeOneItem: () => { },
    removeItem: () => { },
    clearCart: () => { },
    refreshSettings: async () => { },
    setPincode: () => { },
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    useEffect(() => {
        // Load Pincode from LocalStorage
        const savedPincode = localStorage.getItem('user_pincode');
        if (savedPincode) {
            dispatch({ type: 'SET_PINCODE', payload: savedPincode });
        }

        // Fetch Settings on Mount
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/menu/config');
                // Ensure we handle defaults if server returns partial data
                const settings: CartSettings = {
                    deliveryFee: data.deliveryFee ?? DEFAULT_SETTINGS.deliveryFee,
                    freeDeliveryThreshold: data.freeDeliveryThreshold ?? DEFAULT_SETTINGS.freeDeliveryThreshold,
                    freeGiftThreshold: data.freeGiftThreshold ?? DEFAULT_SETTINGS.freeGiftThreshold,
                    minOrderValue: data.minOrderValue ?? DEFAULT_SETTINGS.minOrderValue
                };
                dispatch({ type: 'SET_SETTINGS', payload: settings });
            } catch (error) {
                console.error("Failed to fetch cart settings:", error);
            }
        };

        fetchSettings();
    }, []);

    const addItem = (item: CartItem) => {
        dispatch({ type: 'ADD_ITEM', payload: item });
    };

    const removeOneItem = (item: { _id: string; variant?: { name: string } }) => {
        dispatch({ type: 'REMOVE_ONE_ITEM', payload: item });
    };

    const removeItem = (item: { _id: string; variant?: { name: string } }) => {
        dispatch({ type: 'REMOVE_ITEM', payload: item });
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
    };

    const refreshSettings = async () => {
        try {
            const { data } = await api.get('/menu/config');
            const settings: CartSettings = {
                deliveryFee: data.deliveryFee ?? DEFAULT_SETTINGS.deliveryFee,
                freeDeliveryThreshold: data.freeDeliveryThreshold ?? DEFAULT_SETTINGS.freeDeliveryThreshold,
                freeGiftThreshold: data.freeGiftThreshold ?? DEFAULT_SETTINGS.freeGiftThreshold,
                minOrderValue: data.minOrderValue ?? DEFAULT_SETTINGS.minOrderValue
            };
            dispatch({ type: 'SET_SETTINGS', payload: settings });
        } catch (error) {
            console.error("Failed to refresh cart settings:", error);
        }
    };

    const setPincode = (code: string) => {
        localStorage.setItem('user_pincode', code);
        dispatch({ type: 'SET_PINCODE', payload: code });
    };

    return (
        <CartContext.Provider value={{ state, addItem, removeOneItem, removeItem, clearCart, refreshSettings, setPincode }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
