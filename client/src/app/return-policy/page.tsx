"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const ReturnPolicy = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="bg-card shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
                    <Link
                        href="/"
                        className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Return & Refund Policy</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-card rounded-xl shadow-sm p-6 md:p-10 space-y-8">
                    <div className="border-b pb-6">
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            Return & Refund Policy
                        </h2>
                        <p className="text-gray-500 text-sm">Last updated: January 2026</p>
                    </div>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            1. General Policy
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            At Zomoggy, we strive to ensure that you are satisfied with your purchase. However, due to the perishable nature of our food products, we generally do not accept returns.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            2. Refunds and Replacements
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            We may issue a refund or replacement in the following scenarios:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                <strong>Wrong Item:</strong> If you received an item different from what you ordered.
                            </li>
                            <li>
                                <strong>Missing Item:</strong> If an item is missing from your order.
                            </li>
                            <li>
                                <strong>Damaged or Spilled:</strong> If the food arrived in a damaged or spilled condition due to delivery mishandling.
                            </li>
                            <li>
                                <strong>Quality Issues:</strong> If there are significant quality issues with the food (e.g., burnt, stale).
                            </li>
                        </ul>
                        <p className="mt-4 text-gray-600 leading-relaxed">
                            To request a refund or replacement, please contact us within 2 hours of receiving your order with photographic evidence of the issue.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            3. Cancellations & Refunds
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            You may cancel your order through the app before it is out for delivery. However, a <strong>cancellation fee of ₹20</strong> will be deducted from your refund amount.
                        </p>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            <strong>Unresponsive Customers:</strong> If our delivery partner reaches your location and attempts to contact you 10 times without a response, the order will be cancelled by the restaurant. In this case, <strong>no refund will be issued</strong>.
                        </p>
                    </section>

                    <section className="pt-6 border-t mt-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            Contact Us
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            If you have any questions about our Return & Refund Policy, please contact us via our support channels in the app or website.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-card border-t mt-12 py-8 px-4">
                <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Zomoggy. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default ReturnPolicy;
