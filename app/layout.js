// app/layout.js
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSeasonFlags } from "@/lib/seasonUtils";
import THEME_MAP from "@/lib/bannerThemes";
import NavAwareBanner from "@/components/NavAwareBanner";
import CartProvider from "@/components/cart/CartContext";
import CartButton from "@/components/cart/CartButton";
import CartSheet from "@/components/cart/CartSheet";
import { Toaster } from "react-hot-toast";

// ✅ GA imports
import Analytics from "@/components/Analytics";
import GAProvider from "@/components/GAProvider";

// ✅ Suspense for GAProvider (because it uses useSearchParams)
import { Suspense } from "react";

export const metadata = {
  title: "Mabel’s Pawfect Pet Services",
  description: "Affordable, loving pet care you can trust.",
  icons: { icon: "/favicon-v2.ico" },
};

export default function RootLayout({ children }) {
  const { isHalloween, isFall, isSummer, isThanksgiving, isChristmas } =
    getSeasonFlags("christmas");

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&family=Quicksand&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon-v2.ico" />

        <meta
          name="impact-site-verification"
          value="989723e1-0d46-437e-8417-a9218c3e0274"
        />
      </head>

      <body className="min-h-screen bg-gradient-to-b from-white to-pink-50">
        {/* 👇 Wrap GAProvider (which uses useSearchParams) in Suspense */}
        <Suspense fallback={null}>
          <GAProvider>
            {/* Provide cart state to the whole app */}
            <CartProvider>
              <Navbar />

              {isChristmas && (
                <NavAwareBanner
                  {...THEME_MAP.christmas}
                  id="banner-2025-christmas"
                  title="🎄 Christmas Specials"
                  subtitle="Holiday pricing through Dec 31 • Free shipping on orders over $75"
                  link="/pricing-seasonal"
                  dismissible={false}
                  leadIcon="🎄"
                  showTrailIcon
                  trailIcon="🎁"
                />
              )}

              <Toaster position="top-right" />
              <main className="pt-20">{children}</main>
              <Footer />
              <CartButton />
              <CartSheet />
            </CartProvider>
          </GAProvider>
        </Suspense>

        {/* GA script loader */}
        <Analytics />
      </body>
    </html>
  );
}
