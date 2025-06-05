// app/page.js
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ServicesPreview from "@/components/ServicesPreview";
import TestimonialsSection from "@/components/TestimonialsSection";
import FinalCTA from "@/components/FinalCTA";
import SeasonalSpecial from "@/components/SeasonalSpecial"; // 👈 Add this import
import Link from "next/link";

export default function Home() {
  const isSummer =
    new Date() >= new Date("2025-05-12") &&
    new Date() <= new Date("2025-08-31");

  return (
    <>
      <HeroSection isSummer={isSummer} />
      <AboutSection />

      {/* 👇 Render seasonal promo only if active */}
      {isSummer && <SeasonalSpecial />}

      <ServicesPreview />
      <TestimonialsSection />
      <FinalCTA />

      {/* ✅ Sticky Book Now button for mobile only */}
      <Link href="/booking">
        <button className="fixed bottom-5 right-5 z-50 bg-pink-500 text-white px-4 py-3 rounded-full shadow-lg md:hidden">
          📅 Book Now
        </button>
      </Link>
    </>
  );
}

