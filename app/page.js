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

        {/* Trust / credentials CTA strip */}
        <section className="py-4 px-6">
          <div className="max-w-4xl mx-auto bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-blue-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              <p className="text-sm text-gray-800">
                Want to see Bridget’s training, certifications, and work
                history?
              </p>
            </div>

            <Link
              href="/training-and-credentials"
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-4"
            >
              View my training &amp; credentials →
            </Link>
          </div>
        </section>

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
