// components/specials/BlackFridayCountdown.jsx
"use client";

import { useEffect, useState } from "react";
import { BLACK_FRIDAY_PROMO } from "@/lib/blackFridayConfig";

function getTimeLeft() {
  const now = new Date();
  const end = BLACK_FRIDAY_PROMO?.endsAt ?? new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, expired: false };
}

export default function BlackFridayCountdown() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(() => getTimeLeft());

  // Only show countdown after client mount → no SSR/client mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      setTime(getTimeLeft());
    }, 1000);
    return () => clearInterval(id);
  }, [mounted]);

  if (!mounted || time.expired) {
    // While SSR / before mount, or after expiry → render nothing (or a static banner if you want)
    return null;
  }

  const blocks = [
    { label: "DAY", value: time.days },
    { label: "HRS", value: time.hours },
    { label: "MIN", value: time.minutes },
    { label: "SEC", value: time.seconds },
  ];

  return (
    <section className="mt-3 sm:mt-4 rounded-lg bg-black text-white px-4 py-3 sm:px-6 sm:py-4 text-center">
      <p className="text-xs sm:text-sm font-semibold tracking-wide mb-2">
        BLACK FRIDAY ENDS IN
      </p>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {blocks.map((b) => (
          <div
            key={b.label}
            className="bg-white text-black rounded-md px-2 py-1 sm:px-3 sm:py-2 min-w-[42px]"
          >
            <div className="text-lg sm:text-xl font-bold leading-none">
              {String(b.value).padStart(2, "0")}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold opacity-80">
              {b.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
