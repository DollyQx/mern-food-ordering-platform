import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { SocketProvider } from "@/context/SocketContext";

import ToastProvider from "@/components/providers/ToastProvider";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zomoggy",
  description: "Delicious Food Delivered Fast",
  openGraph: {
    title: "Zomoggy",
    description: "Delicious Food Delivered Fast",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <SocketProvider>
            <ClientLayout>
              <ToastProvider />
              {children}
            </ClientLayout>
          </SocketProvider>
        </CartProvider>
      </body>
    </html>
  );
}

