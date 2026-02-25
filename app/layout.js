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
    isOffSeason,
  } = getSeasonFlags(FORCE_SEASON);

  // Optional: season-aware background. You can simplify if you want.
  const bodyBgClass = isStPatricks
    ? "min-h-screen bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7]" // soft green
    : isChristmas
      ? "min-h-screen bg-gradient-to-b from-white to-sky-50"
      : "min-h-screen bg-gradient-to-b from-white to-pink-50"; // default / valentines-ish

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
        {/* ⬇️ Everything that uses useSearchParams / usePathname */}
        <Suspense fallback={null}>
          <Analytics />
          <GAProvider>
            <CartProvider>
              <div aria-hidden className="h-[72px] md:h-[80px]" />

              <Navbar />

              <div className="min-h-[72px] sm:min-h-[64px]">
                {isStPatricks ? (
                  <NavAwareBanner
                    {...THEME_MAP.stpatricks}
                    id="banner-stpatricks-2026"
                    title="Everyday Pet Care Pricing"
                    subtitle="Reliable care for dogs and cats, all month long."
                    link="/pricing-seasonal"
                    ctaText="View Pricing"
                    leftIcon="☘️"
                    rightIcon="🐾"
                    dismissible={false}
                    analyticsLocation="banner_stpatricks"
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
                    {...THEME_MAP.offSeason}
                    id="banner-off-season"
                    title="Off-Season Updates"
                    subtitle="Regular pricing is active. Seasonal specials return soon."
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
