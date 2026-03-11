'use client';

import { motion } from "framer-motion";
import { Check, ClipboardList, ChefHat, Truck, PackageCheck } from "lucide-react";

interface OrderStepperProps {
    currentStatus: string;
    deliveryInfo?: {
        deliveryBoyName?: string;
        contactNumber?: string;
    };
}

const steps = [
    { label: 'Placed', icon: ClipboardList, statusKey: 'Placed' },
    { label: 'Preparing', icon: ChefHat, statusKey: 'Preparing' },
    { label: 'Out for Delivery', icon: Truck, statusKey: 'Out for Delivery' },
    { label: 'Delivered', icon: PackageCheck, statusKey: 'Delivered' },
];

export function OrderStepper({ currentStatus, deliveryInfo }: OrderStepperProps) {
    // Determine active index based on status
    // Statuses: Placed -> Preparing -> Out for Delivery -> Delivered
    // Cancelled is special case

    let activeIndex = 0;
    if (currentStatus === 'Delivered') activeIndex = 4; // Complete
    else if (currentStatus === 'Out for Delivery') activeIndex = 2;
    else if (currentStatus === 'Preparing') activeIndex = 1;
    else if (currentStatus === 'Placed') activeIndex = 0;
    else activeIndex = -1; // Cancelled or unknown

    if (currentStatus === 'Cancelled') {
        return (
            <div className="w-full bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                <p className="text-red-600 font-bold">Order Cancelled</p>
            </div>
        );
    }

    return (
        <div className="w-full py-6">
            <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto px-2">

                {/* Connecting Line - Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full -z-10" />

                {/* Connecting Line - Progress */}
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded-full -z-10 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: activeIndex / (steps.length - 1) }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ width: '100%' }} // scaleX handles the actual width visual
                />

                {steps.map((step, index) => {
                    const isCompleted = index <= activeIndex;
                    const isCurrent = index === activeIndex;

                    return (
                        <div key={step.label} className="flex flex-col items-center gap-2 relative">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isCurrent ? 1.2 : 1,
                                    backgroundColor: isCompleted ? "#22c55e" : "#f3f4f6",
                                    color: isCompleted ? "#ffffff" : "#9ca3af",
                                    borderColor: isCompleted ? "#22c55e" : "#e5e7eb"
                                }}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 z-10 transition-colors duration-300 shadow-sm`}
                            >
                                {isCompleted ? <step.icon size={18} /> : <span>{index + 1}</span>}
                            </motion.div>
                            <span className={`absolute top-10 md:top-12 text-[10px] md:text-xs font-semibold whitespace-nowrap ${isCompleted ? 'text-green-700' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}

            </div>

            {/* Delivery Boy Name Display */}
            {currentStatus === 'Out for Delivery' && deliveryInfo?.deliveryBoyName && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-center"
                >
                    <div className="inline-block bg-blue-50 border border-blue-100 px-4 py-2 rounded-full">
                        <span className="text-sm text-blue-800">
                            🚴 Out for delivery by <strong>{deliveryInfo.deliveryBoyName}</strong>
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
