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
import OffSeasonSpecials from "@/components/specials/OffSeasonSpecials";
import { getSeasonFlags } from "@/lib/seasonUtils";

import SnowOverlay from "@/components/SnowOverlay";
// import ValentinesSpecials from "@/components/specials/ValentinesSpecials"; // later

export default function Home() {
  const FORCE_SEASON = (process.env.NEXT_PUBLIC_FORCE_SEASON || "")
    .trim()
    .toLowerCase();

  const { isSummer, isThanksgiving, isChristmas, isValentines, isOffSeason } =
    getSeasonFlags(FORCE_SEASON);

  return (
    <>
      <SnowOverlay />

      <div className="relative z-10">
        <HeroSection isSummer={isSummer} />
        <ShopCTA />
        <AboutSection />

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

        {/* Specials block (exactly one) */}
        {/* {isValentines && <ValentinesSpecials />} */}
        {isThanksgiving && <ThanksgivingSpecials />}
        {isChristmas && <ChristmasSpecials />}
        {isOffSeason && <OffSeasonSpecials />}

        {/* <AnnouncementBlock /> */}

        <ServicesPreview />
        <TestimonialsSection />

        <section className="mt-24 mb-24 px-6">
      <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        
        {/* Text */}
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
            From the Pet Sitter’s Nook
          </h2>

          <p className="text-neutral-600 leading-relaxed max-w-prose">
            Pet sitting isn’t just care — it’s connection.
            This special edition reflects the love, memories, and pets
            who shaped our journey as we said goodbye to 2025 and welcomed 2026.
          </p>

          {/* Soft link to Memoriam */}
          <div className="mt-10">
            <Link
              href="/gallery/memoriam"
              className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 font-medium underline underline-offset-4"
            >
              Visit our Memorial Gallery 🤍
            </Link>
          </div>
        </div>
        </div>
      </section>

        <NewsletterCarousel />
        <FinalCTA />

        <BookingFloatingButton />
      </div>
    </>
  );
}
