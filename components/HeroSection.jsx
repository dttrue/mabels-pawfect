// components/HeroSection.jsx
"use client";

import Link from "next/link";
import { trackHeroBookNow } from "@/lib/ga-events";
import { useRouter } from "next/navigation";
import Image from "next/image";
export default function HeroSection() {
  const router = useRouter();

  const handleBookNowClick = (e) => {
    e.preventDefault(); // stop the instant navigation
    trackHeroBookNow();

    // Navigate after a tiny delay so GA can record the event
    setTimeout(() => {
      router.push("/booking");
    }, 120);
  };

  return (
    <section className="py-10 text-center animate-fade-in">
      {/* Hero Image */}
      <div className="animate-fade-in">
        <div className="w-full max-w-4xl mx-auto">
          <Image
            src="/images/christmas_hero_2025.png"
            alt="Friendly dog and cat"
            width={1200} // match your real image ratio
            height={1600} // or whatever it actually is
            className="w-full h-auto rounded-lg shadow-lg"
            priority // mark as LCP
            fetchPriority="high" // tell the browser it's important
            decoding="async"
            sizes="(max-width: 768px) 100vw, 70vw"
          />
        </div>
      </div>

      {/* CTA Box */}
      <div className="mt-10 bg-pink-50 border border-pink-200 shadow rounded-lg px-4 py-6 max-w-md mx-auto text-center animate-fade-in hover:animate-pulse transition">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-gray-900 mb-4">
          Caring for Your Pets <br />
          Like They’re <span className="italic text-pink-600">Family</span> 🐾
        </h1>

        <p className="text-base sm:text-lg text-gray-600 mb-6">
          Personalized, loving care for your dogs and cats while you're away.
        </p>

        {/* BOOK NOW CTA w/ GA4 Event */}
        <button
          onClick={handleBookNowClick}
          className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition duration-200"
        >
          Book Now
        </button>

        <p className="mt-2 text-xs text-gray-500">Takes less than 1 minute</p>
      </div>
    </section>
  );
}

