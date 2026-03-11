'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Music, Utensils, X, CheckCircle, ChevronLeft, ChevronRight, Phone, Star, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const images = [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464366400600-7168b8af0bc3?q=80&w=2069&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1530103862676-de3c9da59af7?q=80&w=2069&auto=format&fit=crop"
];

export const PartyHallCard = () => {
    const router = useRouter();
    const [currentImage, setCurrentImage] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Modal State
    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('Night');
    const [guests, setGuests] = useState(100);
    const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');

    // Auto-slide images
    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 4000); // Slower slide for premium feel
        return () => clearInterval(timer);
    }, []);

    const handleCheckAvailability = async () => {
        setCheckStatus('checking');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/party-hall/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, timeSlot })
            });
            const data = await res.json();

            if (data.available) {
                setCheckStatus('available');
            } else {
                setCheckStatus('unavailable');
                toast.error("Slot already booked. Please choose another date.");
            }
        } catch (error) {
            console.error(error);
            setCheckStatus('idle');
            toast.error("Failed to check availability");
        }
    };

    return (
        <div className="w-full my-6 md:my-10 px-0 md:px-0">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative overflow-hidden rounded-3xl shadow-2xl bg-slate-950 text-white flex flex-col md:grid md:grid-cols-2 min-h-[420px] md:min-h-[480px] border border-white/5"
            >
                {/* Image Layer */}
                <div className="absolute inset-0 md:relative md:order-2 h-full w-full overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentImage}
                            src={images[currentImage]}
                            initial={{ opacity: 0, scale: 1.15 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2 }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </AnimatePresence>

                    {/* Modern Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent md:hidden" />
                    <div className="hidden md:block absolute inset-0 bg-gradient-to-l from-transparent via-slate-950/20 to-slate-950" />
                </div>

                {/* Content Layer */}
                <div className="relative z-10 p-6 md:p-10 flex flex-col justify-end md:justify-center md:order-1 h-full pointer-events-none md:pointer-events-auto">
                    <div className="pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {/* Premium Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 backdrop-blur-md text-amber-400 text-xs md:text-sm font-semibold mb-4 border border-amber-500/20 shadow-lg shadow-amber-500/5">
                                <Sparkles size={14} className="text-amber-400" />
                                <span>Premium Venue</span>
                            </div>

                            <h2 className="text-3xl md:text-5xl font-bold mb-3 font-serif tracking-tight leading-none text-white drop-shadow-xl">
                                Celebrate Life's <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Golden Moments</span>
                            </h2>

                            <p className="text-slate-300 md:text-slate-400 mb-8 text-sm md:text-base font-light tracking-wide leading-relaxed max-w-sm drop-shadow-md">
                                Host unforgettable events for 100-150 guests with our exclusive catering and luxury decor.
                            </p>

                            {/* Features Chips */}
                            <div className="flex gap-3 mb-8 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                                {[
                                    { icon: Utensils, text: "Gourmet Catering" },
                                    { icon: Music, text: "Pro DJ System" },
                                    { icon: Star, text: "Luxury Decor" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex-shrink-0">
                                        <item.icon size={14} className="text-amber-400" />
                                        <span className="text-xs font-medium text-slate-200">{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col md:flex-row gap-3 md:items-center">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold text-sm md:text-base shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all border border-amber-400/50"
                                >
                                    Check Dates
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/party-hall')}
                                    className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white font-semibold text-sm md:text-base hover:bg-white/10 transition-all"
                                >
                                    View Gallery
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Floating WhatsApp */}
                <motion.a
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 }}
                    href="https://wa.me/918512852827?text=Hi, I want to book the Party Hall"
                    target="_blank"
                    className="absolute top-4 right-4 md:top-auto md:bottom-8 md:right-8 p-3 bg-[#25D366] text-white rounded-full shadow-2xl z-20 cursor-pointer hover:bg-[#20bd5a] hover:scale-110 transition-all"
                >
                    <Phone size={20} fill="white" />
                </motion.a>
            </motion.div>

            {/* Premium Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 pb-24 md:pb-4">
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-bold text-white font-serif">Plan Your Event</h3>
                                    <p className="text-slate-400 text-xs">Select details to check availability</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-5 relative z-10">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Event Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={date}
                                            onChange={(e) => { setDate(e.target.value); setCheckStatus('idle'); }}
                                            className="w-full pl-10 p-3.5 rounded-xl bg-slate-800 border-none text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Time</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            </div>
                                            <select
                                                value={timeSlot}
                                                onChange={(e) => { setTimeSlot(e.target.value); setCheckStatus('idle'); }}
                                                className="w-full pl-8 p-3.5 rounded-xl bg-slate-800 border-none text-white focus:ring-2 focus:ring-amber-500/50 outline-none appearance-none"
                                            >
                                                <option value="Day">Day (11AM-4PM)</option>
                                                <option value="Night">Night (6PM-11PM)</option>
                                                <option value="Full Day">Full Day</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Guests</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                            <input
                                                type="number"
                                                min="10"
                                                max="150"
                                                value={guests}
                                                onChange={(e) => setGuests(parseInt(e.target.value))}
                                                className="w-full pl-10 p-3.5 rounded-xl bg-slate-800 border-none text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Status Messages */}
                                <AnimatePresence mode="wait">
                                    {checkStatus === 'available' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3"
                                        >
                                            <CheckCircle size={20} className="shrink-0" />
                                            <div>
                                                <p className="font-bold text-sm">Date Available!</p>
                                                <p className="text-xs opacity-80">You can proceed to book this slot.</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {checkStatus === 'unavailable' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium text-center"
                                        >
                                            Sorry, this slot is already booked.
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Action Button */}
                                <div className="pt-2">
                                    <Button
                                        onClick={checkStatus === 'available'
                                            ? () => router.push(`/party-hall?date=${date}&slot=${timeSlot}&guests=${guests}`)
                                            : handleCheckAvailability}
                                        disabled={!date || checkStatus === 'checking'}
                                        className={`w-full py-6 text-base font-bold rounded-xl transition-all shadow-lg ${checkStatus === 'available'
                                                ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 hover:shadow-amber-500/25'
                                                : 'bg-slate-100 text-slate-900 hover:bg-white'
                                            }`}
                                    >
                                        {checkStatus === 'checking' ? 'Checking Availability...' :
                                            checkStatus === 'available' ? 'Proceed to Book' : 'Check Availability'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

