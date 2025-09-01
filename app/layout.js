// app/layout.js
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSeasonFlags } from "@/lib/seasonUtils";
import THEME_MAP from "@/lib/bannerThemes";
import NavAwareBanner from "@/components/NavAwareBanner";

import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Mabel’s Pawfect Pet Services",
  description: "Affordable, loving pet care you can trust.",
  icons: { icon: "/favicon-v2.ico" },
};

export default function RootLayout({ children }) {
  const { isHalloween, isFall, isSummer } = getSeasonFlags("halloween");

  
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&family=Quicksand&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon-v2.ico" />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-white to-pink-50">
        <Navbar />

        {/* 🎃 Seasonal banner sits directly under the fixed nav */}
        {isHalloween && (
          <NavAwareBanner
            {...THEME_MAP.halloween}
            id="banner-2025-halloween"
            title="🎃 Halloween Specials"
            subtitle="Out of Office Oct 27–31 • Book early!"
            link="/pricing-seasonal"
            dismissible={false}
            bg="bg-black bg-gradient-to-r from-[#0d0d0f] via-[#0a0a0a] to-black"
            leadIcon="🎃"
            showBatDivider
            showTrailIcon
            trailIcon="🕸️"
          />
        )}

        {/* Keep your main padding for the fixed NAV only */}
        <Toaster position="top-right" />
        <main className="pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
