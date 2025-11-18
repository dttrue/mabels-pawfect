// components/FinalCTA.jsx

"use client";

import Link from "next/link";
import { trackBookingCTA } from "@/lib/ga-events";

export default function FinalCTA() {
  const handleClick = () => {
    trackBookingCTA(); // GA4: booking_cta_click
  };

  return (
    <section className="bg-white py-16 px-4 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Book Loving Pet Care?
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Whether it’s a quick walk or an extended stay, Bridget is here to
          help. Book your pet’s care today!
        </p>
        <Link href="/booking">
          <button
            onClick={handleClick}
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition duration-200"
          >
            Book Now 🐾
          </button>
        </Link>
      </div>
    </section>
  );
}
