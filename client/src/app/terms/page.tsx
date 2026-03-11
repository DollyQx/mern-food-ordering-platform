"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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
                    <h1 className="text-xl font-bold text-gray-900">Terms of Service</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-card rounded-xl shadow-sm p-6 md:p-10 space-y-8">
                    <div className="border-b pb-6">
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            Terms and Conditions
                        </h2>
                        <p className="text-gray-500 text-sm">Last updated: January 2026</p>
                    </div>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            1. Introduction
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            Welcome to Zomoggy! By accessing our website and using our services,
                            you agree to be bound by these Terms and Conditions. Please read them carefully.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            2. Use of Service
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            You must be at least 18 years old to use our services. By using Zomoggy,
                            you represent and warrant that you have the right, authority, and capacity
                            to enter into this agreement.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>You agree to provide accurate and complete information when creating an account.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You agree not to use our services for any illegal or unauthorized purpose.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            3. Orders and Payments
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            When you place an order through Zomoggy, you are making an offer to purchase
                            the items at the specified price.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>All orders are subject to availability and acceptance by the restaurant.</li>
                            <li>Prices are subject to change without notice.</li>
                            <li>Payment must be made at the time of order or upon delivery (for COD orders).</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            4. User Content
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            Any reviews, comments, or other content you submit to Zomoggy must not be
                            illegal, obscene, threatening, defamatory, or otherwise objectionable.
                            We reserve the right to remove any content that violates these terms.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            5. Limitation of Liability
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            Zomoggy shall not be liable for any indirect, incidental, special, consequential,
                            or punitive damages, including without limitation, loss of profits, data, use,
                            goodwill, or other intangible losses, resulting from your use of the service.
                        </p>
                    </section>

                    <section className="pt-6 border-t mt-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            Contact Us
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            If you have any questions about these Terms and Conditions, please contact us at support@zomoggy.com.
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

export default TermsOfService;
