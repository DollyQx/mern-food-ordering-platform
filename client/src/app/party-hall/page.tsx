'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Correct import for App Router
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, CheckCircle, Music, Utensils, Star, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Script from 'next/script'; // For Razorpay

// Images for Gallery
const galleryImages = [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464366400600-7168b8af0bc3?q=80&w=2069&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1530103862676-de3c9da59af7?q=80&w=2069&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
];

function PartyHallContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        eventType: 'Birthday',
        date: searchParams.get('date') || '',
        timeSlot: searchParams.get('slot') || 'Night',
        guestCount: parseInt(searchParams.get('guests') || '100'),
        cateringRequired: true,
        specialRequirements: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Packages
    const packages = [
        { name: "Basic", price: "₹15,000", features: ["Hall Rental (4 Hrs)", "Basic Lighting", "Cleaning", "Furniture"] },
        { name: "Standard", price: "₹25,000", features: ["Hall Rental (6 Hrs)", "DJ & Sound", "Decoration", "Welcome Drinks"] },
        { name: "Premium", price: "₹40,000", features: ["Full Day Rental", "Premium Decor", "Pro DJ", "Photography", "Cake"] }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.phone || !formData.date) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Create Booking & Get Token Order
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/party-hall/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...formData,
                    tokenAmount: 2000, // Fixed Token Amount
                    contactInfo: { name: formData.name, phone: formData.phone }
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Booking failed');
            }

            // 2. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.razorpayOrder.amount,
                currency: data.razorpayOrder.currency,
                name: "Zomoggy Party Hall",
                description: "Booking Token Amount",
                order_id: data.razorpayOrder.id,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/party-hall/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                                bookingId: data.booking._id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            toast.success("Booking Confirmed!", { description: "We have received your token amount." });
                            router.push('/orders'); // Or a generic success page
                        } else {
                            toast.error("Payment Verification Failed");
                        }
                    } catch (err) {
                        toast.error("Verification Error");
                    }
                },
                prefill: {
                    name: formData.name,
                    contact: formData.phone
                },
                theme: {
                    color: "#0F172A"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20 text-slate-900 dark:text-gray-100">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            {/* Hero Section */}
            <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10 flex flex-col items-center justify-center text-center p-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold text-white mb-4 font-serif"
                    >
                        Celebrate in Style
                    </motion.h1>
                    <p className="text-xl text-gray-200">The Perfect Venue for your Special Moments</p>
                </div>
                <img
                    src={galleryImages[0]}
                    className="w-full h-full object-cover"
                    alt="Party Hall"
                />
            </div>

            <div className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="grid md:grid-cols-3 gap-8">

                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Highlights Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Star className="text-[#FFD700] fill-current" />
                                Venue Highlights
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { icon: Users, label: "100-150 Guests" },
                                    { icon: Music, label: "Sound System" },
                                    { icon: Utensils, label: "In-house Catering" },
                                    { icon: CheckCircle, label: "AC Hall" }
                                ].map((item, i) => (
                                    <div key={i} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-zinc-800">
                                        <item.icon className="mx-auto mb-2 text-[#0F172A] dark:text-[#FFD700]" />
                                        <div className="font-semibold text-sm">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Packages */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Standard Packages</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {packages.map((pkg, i) => (
                                    <div key={i} className={`p-6 rounded-2xl border-2 ${pkg.name === 'Standard' ? 'border-[#FFD700] bg-[#FFD700]/5' : 'border-transparent bg-white dark:bg-zinc-900'}`}>
                                        <div className="text-lg font-bold mb-1">{pkg.name}</div>
                                        <div className="text-2xl font-bold text-[#0F172A] dark:text-[#FFD700] mb-4">{pkg.price}</div>
                                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                            {pkg.features.map((f, j) => (
                                                <li key={j} className="flex items-center gap-2">
                                                    <CheckCircle size={14} className="text-green-500" /> {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Booking Form */}
                    <div className="relative">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl sticky top-24 border-t-4 border-[#FFD700]">
                            <h3 className="text-xl font-bold mb-6">Book Your Slot</h3>

                            <form onSubmit={handleBooking} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-[#FFD700] text-slate-900 dark:text-white"
                                        placeholder="Enter your name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 10) {
                                                    setFormData({ ...formData, phone: val });
                                                }
                                            }}
                                            required
                                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 outline-none text-slate-900 dark:text-white"
                                            placeholder="Mobile No"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Guests</label>
                                        <input
                                            type="number"
                                            name="guestCount"
                                            value={formData.guestCount}
                                            onChange={handleInputChange}
                                            min="10" max="150"
                                            required
                                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 outline-none text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 outline-none text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Time Slot</label>
                                        <select
                                            name="timeSlot"
                                            value={formData.timeSlot}
                                            onChange={handleInputChange}
                                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 outline-none text-slate-900 dark:text-white"
                                        >
                                            <option value="Day">Day (11-4)</option>
                                            <option value="Night">Night (6-11)</option>
                                            <option value="Full Day">Full Day</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Event Type</label>
                                    <select
                                        name="eventType"
                                        value={formData.eventType}
                                        onChange={handleInputChange}
                                        className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 outline-none text-slate-900 dark:text-white"
                                    >
                                        <option value="Birthday">Birthday Party</option>
                                        <option value="Kitty Party">Kitty Party</option>
                                        <option value="Engagement">Engagement</option>
                                        <option value="Corporate">Corporate Event</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm flex gap-3 text-blue-800 dark:text-blue-200">
                                    <ShieldCheck className="shrink-0" />
                                    <div>
                                        <span className="font-bold">Token Amount: ₹2,000</span>
                                        <p className="text-xs opacity-80">Pay small token now to confirm. Refundable up to 48 hrs before event.</p>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-6 text-lg font-bold bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-xl shadow-lg"
                                >
                                    {isSubmitting ? 'Processing...' : 'Pay ₹2,000 & Confirm'}
                                </Button>

                                <div className="text-center">
                                    <span className="text-xs text-gray-500">OR</span>
                                </div>

                                <a
                                    href="https://wa.me/918512852827?text=I want to book the hall manually."
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block w-full py-3 text-center rounded-xl border-2 border-green-500 text-green-600 font-bold hover:bg-green-50"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Phone size={18} /> Book via WhatsApp
                                    </div>
                                </a>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PartyHallPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <PartyHallContent />
        </Suspense>
    );
}
