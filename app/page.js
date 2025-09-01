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
