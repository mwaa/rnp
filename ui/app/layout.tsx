import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";

// Providers are used to wrap the app in Wagmi and ConnectKit
import AppWalletProvider from "@/components/AppWalletProvider";
import "./globals.css";
import { ReactQueryProvider } from "@/components/react-query";

export const metadata: Metadata = {
  title: "Referral Network Builder",
  description:
    "Build actionable referral links using Blinks in minutes. Start building your referral network today!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <ReactQueryProvider>
          <AppWalletProvider>
            <Navbar />
            {children}
          </AppWalletProvider>
        </ReactQueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
