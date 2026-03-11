'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LocationModal({ isOpen, onClose }: LocationModalProps) {
    const { setPincode } = useCart();
    const [inputPincode, setInputPincode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputPincode.length === 6 && /^\d+$/.test(inputPincode)) {
            setPincode(inputPincode);
            toast.success(`Location set to ${inputPincode}`);
            onClose();
        } else {
            toast.error('Please enter a valid 6-digit Pincode');
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
                // Determine Pincode from Coordinates (Reverse Geocoding)
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();

                if (data && data.address && data.address.postcode) {
                    const detectedPincode = data.address.postcode.replace(/\D/g, ''); // Clean non-digits
                    if (detectedPincode.length === 6) {
                        setPincode(detectedPincode);
                        toast.success(`Location detected: ${detectedPincode}`);
                        onClose();
                    } else {
                        toast.error('Could not determine a valid pincode from your location.');
                    }
                } else {
                    toast.error('Could not find pincode for your location.');
                }
            } catch (error) {
                console.error("Reverse Geocoding Error", error);
                toast.error('Failed to detect location address.');
            } finally {
                setLoading(false);
            }
        }, (err) => {
            console.error("Geolocation Error", err);
            toast.error('Location access denied or failed.');
            setLoading(false);
        });
    };

    // Use Portal to escape Navbar stacking context
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-zinc-900 md:rounded-2xl rounded-t-2xl shadow-2xl border border-white/10 overflow-hidden mb-20 md:mb-0"
                    >
                        {/* Mobile Drag Handle */}
                        <div className="md:hidden flex justify-center pt-3 pb-1">
                            <div className="w-12 h-1.5 bg-zinc-700 rounded-full"></div>
                        </div>

                        <div className="p-6 pt-2 md:pt-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Select Location</h2>
                                    <p className="text-sm text-gray-400">Where should we deliver your food?</p>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Detect Location Button */}
                                <button
                                    onClick={handleDetectLocation}
                                    disabled={loading}
                                    className="w-full flex items-center gap-4 bg-zinc-800 hover:bg-zinc-700 p-4 rounded-xl border border-white/5 transition-all active:scale-[0.98] group"
                                >
                                    <div className="bg-primary/20 p-3 rounded-full text-primary group-hover:scale-110 transition-transform">
                                        {loading ? (
                                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="22" x2="18" y1="12" y2="12" /><line x1="6" x2="2" y1="12" y2="12" /><line x1="12" x2="12" y1="6" y2="2" /><line x1="12" x2="12" y1="22" y2="18" /></svg>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-primary text-base">Use Current Location</div>
                                        <div className="text-xs text-gray-400">Enable location access for best experience</div>
                                    </div>
                                </button>

                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-zinc-700"></div>
                                    <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs uppercase font-bold tracking-wider">Or enter pincode manually</span>
                                    <div className="flex-grow border-t border-zinc-700"></div>
                                </div>

                                {/* Manual Pincode Input */}
                                <form onSubmit={handleManualSubmit} className="flex gap-3">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={inputPincode}
                                            onChange={(e) => setInputPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="Enter 6-digit Pincode"
                                            className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all"
                                            inputMode="numeric"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={inputPincode.length !== 6}
                                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-primary/20"
                                    >
                                        Set
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
