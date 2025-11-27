// lib/blackFridayHelpers.js

import { BLACK_FRIDAY_PROMO } from "./blackFridayConfig"; // 🔥 FIX

export function isBlackFridayActive(now = new Date()) {
  const { active, startsAt, endsAt } = BLACK_FRIDAY_PROMO;
  if (!active) return false;
  return now >= startsAt && now <= endsAt;
}

export function isBlackFridayEligibleSlug(slug) {
  return BLACK_FRIDAY_PROMO.eligibleSlugs.includes(slug);
}
