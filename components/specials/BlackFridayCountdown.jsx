// components/specials/BlackFridayCountdown.jsx
"use client";

import { useEffect, useState } from "react";
import { BLACK_FRIDAY_PROMO } from "@/lib/blackFridayConfig";

export default function BlackFridayCountdown() {
  const end = new Date(BLACK_FRIDAY_PROMO.endsAt).getTime();
  const [timeLeft, setTimeLeft] = useState(end - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(end - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [end]);

  if (timeLeft <= 0) return null;

  const sec = Math.floor((timeLeft / 1000) % 60);
  const min = Math.floor((timeLeft / (1000 * 60)) % 60);
  const hrs = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <section className="w-full bg-black text-white rounded-md mt-4 p-3 sm:p-4 text-center">
      <h3 className="text-xs sm:text-sm font-semibold tracking-wide mb-2">
        BLACK FRIDAY ENDS IN
      </h3>

      <div className="flex justify-center gap-2 sm:gap-4">
        {[
          { label: "DAY", value: days },
          { label: "HRS", value: hrs }, // 👈 Replaces "HOU"
          { label: "MIN", value: min },
          { label: "SEC", value: sec },
        ].map((b) => (
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
