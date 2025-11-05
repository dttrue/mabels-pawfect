// app/page.js
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ServicesPreview from "@/components/ServicesPreview";
import TestimonialsSection from "@/components/TestimonialsSection";
import FinalCTA from "@/components/FinalCTA";
import NewsletterCarousel from "@/components/newsletter/NewsletterCarousel";
import Link from "next/link";


// NEW
import ThanksgivingSpecials from "@/components/specials/ThanksgivingSpecials";
import AnnouncementBlock from "@/components/AnnouncementBlock";
import { getSeasonFlags } from "@/lib/seasonUtils";

export default function Home() {
  // 🔧 dev override
  // app/page.js
  const FORCE_SEASON = process.env.NEXT_PUBLIC_FORCE_SEASON || "";
  const { isSummer, isFall, isHalloween, isThanksgiving } =
    getSeasonFlags(FORCE_SEASON);

  return (
    <>
      <HeroSection isSummer={isSummer} />

      <section
        className="relative my-12 text-center py-16 rounded-2xl overflow-hidden shadow-xl
  bg-gradient-to-br from-[#1b120a] via-[#5a2e0f] to-[#3b1f0e] text-amber-100"
      >
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_#ffcc33_0,_transparent_40%),_radial-gradient(circle_at_80%_30%,_#ffb347_0,_transparent_35%)]" />
        <div className="relative z-10 px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 drop-shadow-lg">
            🏆 Halloween 2025 Winner: Petey the Postman
          </h2>
          <p className="text-base md:text-lg mb-8 max-w-xl mx-auto">
            Huge thanks to everyone who voted! Meet our champion and see the
            highlights.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/contest/halloween-2025/winner"
              className="inline-flex items-center justify-center rounded-md bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-amber-300 shadow-lg"
            >
              Meet Petey →
            </Link>
            <Link
              href="/contest/halloween-2025"
              className="inline-flex items-center justify-center rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-amber-100 hover:bg-white/5"
            >
              See All Entries
            </Link>
          </div>
        </div>
      </section>

      <AboutSection />

      {isSummer && <SeasonalSpecial />}

      {isThanksgiving && <ThanksgivingSpecials />}

      {console.info(
        "render: AnnouncementBlock? isThanksgiving=",
        isThanksgiving
      )}

      {isThanksgiving && (
        <AnnouncementBlock
          title="Thanksgiving Digital Postcard 🦃"
          body="Share our Thanksgiving postcard and check out seasonal rates through Nov 30."
          imageSrc="/images/postcards/fall-thanksgiving-postcard-2025.png"
          ctaHref="/pricing"
          ctaText="View Pricing"
          secondaryHref="/gallery"
          secondaryText="See More Photos"
        />
      )}

      <ServicesPreview />
      <TestimonialsSection />
      <NewsletterCarousel />
      <FinalCTA />

      <Link href="/booking">
        <button className="fixed bottom-5 right-5 z-50 bg-pink-500 text-white px-4 py-3 rounded-full shadow-lg md:hidden">
          📅 Book Now
        </button>
      </Link>
    </>
  );
}
