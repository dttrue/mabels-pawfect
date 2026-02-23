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
import StPatricksSpecials from "@/components/specials/StPatricksSpecials";
import ChristmasSpecials from "@/components/specials/ChristmasSpecials";
import ThanksgivingSpecials from "@/components/specials/ThanksgivingSpecials";
import OffSeasonSpecials from "@/components/specials/OffSeasonSpecials";
import ValentinesSpecials from "@/components/specials/ValentinesSpecials";
// 👉 later you can add:
// import StPatricksSpecials from "@/components/specials/StPatricksSpecials";
import ShamrockOverlay from "@/components/ShamrockOverlay";

import { getSeasonFlags } from "@/lib/seasonUtils";

import SnowOverlay from "@/components/SnowOverlay";

export default function Home() {
  const FORCE_SEASON = (process.env.NEXT_PUBLIC_FORCE_SEASON || "")
    .trim()
    .toLowerCase();

  const {
    isSummer,
    isThanksgiving,
    isChristmas,
    isValentines,
    isStPatricks,
    isOffSeason,
  } = getSeasonFlags(FORCE_SEASON);

  return (
    <>
      {/* Only show snow during Christmas */}
      {isChristmas && <SnowOverlay />}

      {/* Make it rain shamrocks during St. Patrick’s */}
      {isStPatricks && <ShamrockOverlay variant="snow" count={32} />}

      <div className="relative z-10">
        {/* Sticky seasonal banner – prefer St. Patrick’s if active, otherwise Valentine’s */}

        <HeroSection isSummer={isSummer} />
        <ShopCTA />
        <AboutSection />

        {/* Training & credentials promo */}
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
        {/* {isStPatricks && <StPatricksSpecials />}  // <- hook this up once built */}
        {isStPatricks && <StPatricksSpecials />}
        {isValentines && <ValentinesSpecials />}
        {isThanksgiving && <ThanksgivingSpecials />}
        {isChristmas && <ChristmasSpecials />}
        {isOffSeason && <OffSeasonSpecials />}

        <ServicesPreview />
        <TestimonialsSection />

        {/* “From the Pet Sitter’s Nook” */}
        <section className="mt-24 mb-24 px-6">
          <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
                From the Pet Sitter’s Nook
              </h2>

              <p className="text-neutral-600 leading-relaxed max-w-prose">
                Pet sitting isn’t just care — it’s connection. This little
                corner is where we share the moments, memories, and stories of
                the pets who’ve become part of our extended family, including
                the ones we’ve had to say goodbye to with love.
              </p>

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
