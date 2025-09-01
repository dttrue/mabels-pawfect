// lib/seasonUtils.js
function md(now, m, d, endOfDay = false) {
  const y = now.getFullYear();
  // local time to avoid TZ drift; add 23:59:59 for end-of-day bounds
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function getSeasonFlags(forceSeason = "") {
  const now = new Date();

  // natural windows
  const summerStart = md(now, 5, 12);
  const summerEnd = md(now, 8, 31, true);

  const fallStart = md(now, 9, 1);
  const fallEnd = md(now, 10, 26, true);

  const halloweenStart = md(now, 10, 1);
  const halloweenEnd = md(now, 10, 31, true);

  const isSummer =
    (!forceSeason && now >= summerStart && now <= summerEnd) ||
    forceSeason === "summer";

  const isHalloween =
    (!forceSeason && now >= halloweenStart && now <= halloweenEnd) ||
    forceSeason === "halloween";

  const isFall =
    (!forceSeason && now >= fallStart && now <= fallEnd) ||
    forceSeason === "fall" ||
    forceSeason === "halloween"; // count Halloween as fall

  return { isSummer, isFall, isHalloween };
}

// lib/seasonUtils.js
export const THEME_MAP = {
  halloween: {
    bg: "bg-black bg-gradient-to-r from-[#0d0d0f] via-[#0a0a0a] to-black",
    fg: "text-[#FFE8B0]",
    accent: "bg-[#FF6A00]",
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
