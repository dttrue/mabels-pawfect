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
import EasterSpecials from "@/components/specials/EasterSpecials";
import ChristmasSpecials from "@/components/specials/ChristmasSpecials";
import ThanksgivingSpecials from "@/components/specials/ThanksgivingSpecials";
import OffSeasonSpecials from "@/components/specials/OffSeasonSpecials";
import ValentinesSpecials from "@/components/specials/ValentinesSpecials";
import AnnouncementBlock from "@/components/AnnouncementBlock";

import { getSeasonFlags } from "@/lib/seasonUtils";

import SnowOverlay from "@/components/SnowOverlay";
import SpringOverlay from "@/components/SpringOverlay";
export default function Home() {
  const FORCE_SEASON = (process.env.NEXT_PUBLIC_FORCE_SEASON || "")
    .trim()
    .toLowerCase();

  const {
    isSummer,
    isThanksgiving,
    isChristmas,
    isValentines,
    isEaster,
    isOffSeason,
  } = getSeasonFlags(FORCE_SEASON);

  return (
    <>
      {isEaster && <SpringOverlay variant="float" count={36} />}
      {isChristmas && <SnowOverlay />}

      <div className="relative z-10">
        <HeroSection isSummer={isSummer} />
        <ShopCTA />
        <AboutSection />

        {/* Training & credentials promo */}
        <section className="px-6 py-4">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 md:flex-row">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 text-blue-700"
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
              className="text-sm font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-800"
            >
              View my training &amp; credentials →
            </Link>
          </div>
        </section>

        {/* Specials block (exactly one) */}
        {isEaster && <EasterSpecials />}
        {isValentines && <ValentinesSpecials />}
        {isThanksgiving && <ThanksgivingSpecials />}
        {isChristmas && <ChristmasSpecials />}
        {isOffSeason && <OffSeasonSpecials />}

        {/* Seasonal announcement postcard */}
        {isEaster && <AnnouncementBlock />}

        <ServicesPreview />
        <TestimonialsSection />

        {/* “From the Pet Sitter’s Nook” */}
        <section className="mb-24 mt-24 px-6">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-neutral-900">
                From the Pet Sitter’s Nook
              </h2>

              <p className="max-w-prose leading-relaxed text-neutral-600">
                Pet sitting isn’t just care — it’s connection. This little
                corner is where we share the moments, memories, and stories of
                the pets who’ve become part of our extended family, including
                the ones we’ve had to say goodbye to with love.
              </p>

              <div className="mt-10">
                <Link
                  href="/gallery/memoriam"
                  className="inline-flex items-center gap-2 font-medium text-pink-500 underline underline-offset-4 hover:text-pink-600"
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
