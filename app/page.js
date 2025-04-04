import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ServicesPreview from "@/components/ServicesPreview";
import TestimonialsSection from "@/components/TestimonialsSection";
import FinalCTA from "@/components/FinalCTA";

// app/page.js
export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ServicesPreview />
      <TestimonialsSection />
      <FinalCTA />
    </>
  );
}
