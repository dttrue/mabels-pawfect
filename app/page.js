// app/page.js
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ServicesPreview from "@/components/ServicesPreview";
import TestimonialsSection from "@/components/TestimonialsSection";
import FinalCTA from "@/components/FinalCTA";
import NewsletterCarousel from "@/components/newsletter/NewsletterCarousel";
import Link from "next/link";
import ShopCTA from "@/components/home/ShopCTA";
import BookingFloatingButton from "@/components/BookingFloatingButton";
import ChristmasSpecials from "@/components/specials/ChristmasSpecials";
import ThanksgivingSpecials from "@/components/specials/ThanksgivingSpecials";
import AnnouncementBlock from "@/components/AnnouncementBlock";
import { getSeasonFlags } from "@/lib/seasonUtils";
import SnowOverlay from "@/components/SnowOverlay";

export default function Home() {
  const FORCE_SEASON = process.env.NEXT_PUBLIC_FORCE_SEASON || "";
  const { isSummer, isFall, isHalloween, isThanksgiving, isChristmas } =
    getSeasonFlags("christmas");

  return (
    <>
      {/* ❄️ Global homepage snow + pile */}
      <SnowOverlay />

      {/* Content sits above snow (z-10) */}
      <div className="relative z-10">
        <HeroSection isSummer={isSummer} />

        {/* 🛍️ NEW: Shop Call to Action */}
        <ShopCTA />

        <AboutSection />

        {isSummer && <SeasonalSpecial />}

        {isThanksgiving && <ThanksgivingSpecials />}

        {isChristmas && <ChristmasSpecials />}

        {console.info("render: AnnouncementBlock? isChristmas=", isChristmas)}

        <AnnouncementBlock />

        <ServicesPreview />
        <TestimonialsSection />

        <NewsletterCarousel />
        <FinalCTA />

        <BookingFloatingButton />
      </div>
    </>
  );
}
