// components/BookingFloatingButton.jsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackBookingCTA } from "@/lib/ga-events";

export default function BookingFloatingButton() {
  const pathname = usePathname();

  // Only show on the home page
  const isHome = pathname === "/" || pathname === "";
  if (!isHome) return null;

  const handleClick = () => {
    trackBookingCTA();
  };

  return (
    <Link href="/booking" aria-label="Book a pet sitting appointment">
      <button
        onClick={handleClick}
        className="fixed bottom-5 left-5 z-40 bg-pink-500 text-white px-4 py-3 rounded-full shadow-lg md:hidden"
      >
        📅 Book Now
      </button>
    </Link>
  );
}

