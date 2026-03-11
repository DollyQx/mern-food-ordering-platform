"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
                    <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-card rounded-xl shadow-sm p-6 md:p-10 space-y-8">
                    <div className="border-b pb-6">
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            Privacy Policy for Zomoggy
                        </h2>
                        <p className="text-gray-500 text-sm">Last updated: January 2026</p>
                    </div>

                    <section>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            At Zomoggy, accessible from our application, one of our main
                            priorities is the privacy of our visitors. This Privacy Policy
                            document contains types of information that is collected and
                            recorded by Zomoggy and how we use it.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            If you have additional questions or require more information about
                            our Privacy Policy, do not hesitate to contact us.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            Information We Collect
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            The personal information that you are asked to provide, and the
                            reasons why you are asked to provide it, will be made clear to you
                            at the point we ask you to provide your personal information.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>
                                <strong>Account Information:</strong> When you register for an
                                account, we may ask for your contact information, including
                                items such as name, company name, address, email address, and
                                telephone number.
                            </li>
                            <li>
                                <strong>Order Details:</strong> We collect information related
                                to the orders you place, including items purchased, delivery
                                address, and payment confirmation details (we do not store sensitive payment card information directly).
                            </li>
                            <li>
                                <strong>Location Data:</strong> We may request access to your device's location to facilitate delivery services and show you nearby options. You can control this access through your device settings.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            How We Use Your Information
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            We use the information we collect in various ways, including to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>Provide, operate, and maintain our website and app</li>
                            <li>Improve, personalize, and expand our services</li>
                            <li>Understand and analyze how you use our app</li>
                            <li>Develop new products, services, features, and functionality</li>
                            <li>Process your transactions and manage your orders</li>
                            <li>
                                Communicate with you, either directly or through one of our
                                partners, including for customer service, to provide you with
                                updates and other information relating to the website, and for
                                marketing and promotional purposes
                            </li>
                            <li>Find and prevent fraud</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            Log Files
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Zomoggy follows a standard procedure of using log files. These
                            files log visitors when they visit websites. All hosting companies
                            do this and a part of hosting services' analytics. The information
                            collected by log files include internet protocol (IP) addresses,
                            browser type, Internet Service Provider (ISP), date and time
                            stamp, referring/exit pages, and possibly the number of clicks.
                            These are not linked to any information that is personally
                            identifiable. The purpose of the information is for analyzing
                            trends, administering the site, tracking users' movement on the
                            website, and gathering demographic information.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            Cookies and Web Beacons
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Like any other website, Zomoggy uses 'cookies'. These cookies are
                            used to store information including visitors' preferences, and the
                            pages on the website that the visitor accessed or visited. The
                            information is used to optimize the users' experience by
                            customizing our web page content based on visitors' browser type
                            and/or other information.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            Third Party Privacy Policies
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Zomoggy's Privacy Policy does not apply to other advertisers or
                            websites. Thus, we are advising you to consult the respective
                            Privacy Policies of these third-party ad servers for more detailed
                            information. It may include their practices and instructions about
                            how to opt-out of certain options.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            GDPR Data Protection Rights
                        </h3>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <li>The right to access – You have the right to request copies of your personal data.</li>
                            <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate.</li>
                            <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
                            <li>The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
                            <li>The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.</li>
                            <li>The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
                        </ul>
                    </section>

                    <section className="pt-6 border-t mt-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            Consent
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            By using our website, you hereby consent to our Privacy Policy and
                            agree to its Terms and Conditions.
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

export default PrivacyPolicy;
