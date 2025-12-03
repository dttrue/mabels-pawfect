// lib/seasonUtils.js
function md(now, m, d, endOfDay = false) {
  const y = now.getFullYear();
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * forceSeason: "summer" | "fall" | "halloween" | "thanksgiving" | "christmas" | ""
 * SSR-safe: we ALSO include a month check so a stale date range can't kill it.
 */
export function getSeasonFlags(forceSeason = "") {
  const now = new Date();
  const m = now.getMonth() + 1; // 1..12

  // Date windows (kept for nuance)
  const summerStart = md(now, 5, 12);
  const summerEnd = md(now, 8, 31, true);

  const fallStart = md(now, 9, 1);
  const fallEnd = md(now, 11, 30, true);

  const halloweenStart = md(now, 10, 1);
  const halloweenEnd = md(now, 10, 31, true);

  const thanksgivingStart = md(now, 11, 1);
  const thanksgivingEnd = md(now, 11, 30, true);

  const christmasStart = md(now, 12, 1);
  const christmasEnd = md(now, 12, 31, true);

  // Base flags
  let isSummer =
    (!forceSeason && now >= summerStart && now <= summerEnd) ||
    forceSeason === "summer";

  let isHalloween =
    (!forceSeason && now >= halloweenStart && now <= halloweenEnd) ||
    forceSeason === "halloween";

  let isThanksgiving =
    (!forceSeason && now >= thanksgivingStart && now <= thanksgivingEnd) ||
    forceSeason === "thanksgiving";

  let isChristmas =
    (!forceSeason && now >= christmasStart && now <= christmasEnd) ||
    forceSeason === "christmas";

  let isFall =
    (!forceSeason && now >= fallStart && now <= fallEnd) ||
    forceSeason === "fall" ||
    forceSeason === "halloween" ||
    forceSeason === "thanksgiving";

  // SSR robustness: month fallback
  if (!forceSeason) {
    if (m === 11) {
      // November
      isThanksgiving = true;
      isFall = true;
    } else if (m === 12) {
      // December
      isChristmas = true;
    }
  }

  return { isSummer, isFall, isHalloween, isThanksgiving, isChristmas };
}

// Keep themes in ONE place to avoid drift.
export const THEME_MAP = {
  halloween: {
    bg: "bg-black bg-gradient-to-r from-[#0d0d0f] via-[#0a0a0a] to-black",
    fg: "text-[#FFE8B0]",
    accent: "bg-[#FF6A00]",
  },
  thanksgiving: {
    bg: "bg-gradient-to-r from-[#f7ede2] via-[#f3e2d5] to-[#f7ede2]",
    fg: "text-amber-100",
    accent: "bg-amber-500",
  },
  // 🎄 Christmas theme
  christmas: {
    bg: "bg-gradient-to-r from-[#3b0f1b] via-[#5a1025] to-[#0f2f3b]",
    fg: "text-[#8a0f24]",
    accent: "bg-emerald-500",
  },
  fall: {
    bg: "bg-gradient-to-r from-amber-100 via-orange-200 to-amber-200",
    fg: "text-orange-900",
    accent: "bg-orange-600",
  },
  summer: {
    bg: "bg-gradient-to-r from-yellow-100 via-rose-100 to-pink-100",
    fg: "text-pink-900",
    accent: "bg-pink-600",
  },
};
