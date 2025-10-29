// app/page.js
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ServicesPreview from "@/components/ServicesPreview";
import TestimonialsSection from "@/components/TestimonialsSection";
import FinalCTA from "@/components/FinalCTA";
import NewsletterCarousel from "@/components/newsletter/NewsletterCarousel";
import Link from "next/link";


// NEW
import FallSpecials from "@/components/specials/FallSpecials";
import AnnouncementBlock from "@/components/AnnouncementBlock";
import { getSeasonFlags } from "@/lib/seasonUtils";

export default function Home() {
  // 🔧 dev override
  const FORCE_SEASON = "halloween"; // "", "summer", "fall", "halloween"
  const { isSummer, isFall, isHalloween } = getSeasonFlags(FORCE_SEASON);

  return (
    <>
      <HeroSection isSummer={isSummer} />

      <section
        className="relative my-12 text-center py-16 rounded-2xl overflow-hidden shadow-xl
  bg-gradient-to-br from-black via-zinc-900 to-amber-900 text-white"
      >
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,_#ff6a00_0,_transparent_40%),_radial-gradient(circle_at_80%_30%,_#ffb347_0,_transparent_35%)]" />
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold mb-4 drop-shadow-lg">
            👻 The Halloween 2025 Pet Costume Vote is LIVE!
          </h2>
          <p className="text-lg mb-8 max-w-xl mx-auto">
            Check out this year’s adorable contestants and help decide who takes
            home the treats!
          </p>
          <Link
            href="/contest/halloween-2025/vote"
            className="btn btn-accent btn-lg shadow-lg"
          >
            Vote for Your Favorite →
          </Link>
        </div>
      </section>

      <AboutSection />

      {isSummer && <SeasonalSpecial />}
      {isFall && <FallSpecials />}
      {isFall && (
        <AnnouncementBlock
          title="Fall Digital Postcard 🍁"
          body="Share our seasonal postcard and check out special rates through Oct 26."
          imageSrc="/images/postcards/fall-2025.jpg"
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
