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


export const metadata = {
  title: "Mabel’s Pawfect Pet Services",
  description: "Affordable, loving pet care you can trust.",
  icons: { icon: "/favicon-v2.ico" },
};

export default function RootLayout({ children }) {
  const { isHalloween, isFall, isSummer, isThanksgiving } =
    getSeasonFlags("thanksgiving");

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
        {/* Provide cart state to the whole app */}
        <CartProvider>
          <Navbar />

          

          {isThanksgiving && (
            <NavAwareBanner
              {...THEME_MAP.thanksgiving}
              id="banner-2025-thanksgiving"
              title="🦃 Thanksgiving Specials"
              subtitle="Seasonal pricing through Nov 30 • Free shipping on orders over $75"
              link="/pricing-seasonal"
              dismissible={false}
              leadIcon="🦃"
              showTrailIcon
              trailIcon="🍁"
            />
          )}

          <Toaster position="top-right" />
          <main className="pt-20">{children}</main>
          <Footer />
          <CartButton />
          <CartSheet />
        </CartProvider>
      </body>
    </html>
  );
}
