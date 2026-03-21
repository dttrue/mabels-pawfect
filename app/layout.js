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

import Analytics from "@/components/Analytics";
import GAProvider from "@/components/GAProvider";
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
    isValentines,
    isStPatricks,
    isEaster,
    isOffSeason,
  } = getSeasonFlags(FORCE_SEASON);

  const bodyBgClass = isEaster
    ? "min-h-screen bg-gradient-to-b from-[#fff7ed] to-[#fdf2f8]"
    : isChristmas
      ? "min-h-screen bg-gradient-to-b from-white to-sky-50"
      : "min-h-screen bg-gradient-to-b from-white to-pink-50";

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

      <body className={bodyBgClass}>
        <Suspense fallback={null}>
          <Analytics />
          <GAProvider>
            <CartProvider>
              <div aria-hidden className="h-[72px] md:h-[80px]" />

              <Navbar />

              <div className="min-h-[72px] sm:min-h-[64px]">
                {isEaster ? (
                  <NavAwareBanner
                    {...THEME_MAP.easter}
                    id="banner-easter-2026"
                    title="Spring Pet Care"
                    subtitle="Spring visits, festive updates, and reliable care for dogs and cats."
                    link="/pricing-seasonal"
                    ctaText="View Pricing"
                    leftIcon="🐣"
                    rightIcon="🐾"
                    dismissible={false}
                    analyticsLocation="banner_easter"
                  />
                ) : isValentines ? (
                  <NavAwareBanner
                    {...THEME_MAP.valentines}
                    id="banner-valentines-2026"
                    title="Valentine’s Day Specials"
                    subtitle="Sweetheart rates are live through Feb 28."
                    link="/pricing-seasonal"
                    ctaText="See Valentine’s Pricing"
                    leftIcon="❤️"
                    rightIcon="🐾"
                    dismissible={false}
                    analyticsLocation="banner_valentines"
                  />
                ) : isOffSeason ? (
                  <NavAwareBanner
                    {...THEME_MAP.offseason}
                    id="banner-offseason"
                    title="Pawfect Pet Care"
                    subtitle="Affordable, loving pet care you can trust."
                    link="/pricing-seasonal"
                    ctaText="See Pricing"
                    leftIcon="🐾"
                    rightIcon="✨"
                    dismissible={false}
                    analyticsLocation="banner_offseason"
                  />
                ) : null}
              </div>

              <Toaster position="top-right" />
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
