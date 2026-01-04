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
  const FORCE_SEASON = (process.env.NEXT_PUBLIC_FORCE_SEASON || "")
    .trim()
    .toLowerCase();

  const {
    isHalloween,
    isFall,
    isSummer,
    isThanksgiving,
    isChristmas,
    isOffSeason,
  } = getSeasonFlags(FORCE_SEASON);

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
        <Analytics />

        {/* 👇 Wrap GAProvider (which uses useSearchParams) in Suspense */}
        <Suspense fallback={null}>
          <GAProvider>
            {/* Provide cart state to the whole app */}
            <CartProvider>
              {/* Reserve space for fixed navbar (matches Navbar height) */}
              <div aria-hidden className="h-[72px] md:h-[80px]" />

              <Navbar />

              {/* Reserve space for banner to avoid CLS */}
              <div className="min-h-[72px] sm:min-h-[64px]">
                {isOffSeason ? (
                  <NavAwareBanner
                    {...THEME_MAP.offSeason}
                    id="banner-off-season"
                    title="Off-Season Updates"
                    subtitle="Regular pricing is active. Valentine’s specials return soon."
                    link="/pricing-seasonal"
                    ctaText="View Pricing"
                    leftIcon="🐾"
                    rightIcon="💗"
                    dismissible={false}
                    analyticsLocation="banner_off_season"
                  />
                ) : null}
              </div>

              <Toaster position="top-right" />

              {/* Main should not have extra top padding (CLS fix) */}
              <main>{children}</main>

              <Footer />
              <CartButton />
              <CartSheet />
            </CartProvider>
          </GAProvider>
        </Suspense>
      </body>
    </html>
  );
}
