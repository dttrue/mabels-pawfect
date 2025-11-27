// lib/cartPromos.js
import { BLACK_FRIDAY_PROMO } from "./blackFridayConfig";
import {
  isBlackFridayActive,
  isBlackFridayEligibleSlug,
} from "./blackFridayHelpers";

/**
 * items shape (from serializeCart):
 * [
 *   {
 *     id,
 *     qty,
 *     priceCents,
 *     product: { slug, ... },
 *     variant: { ... } | null
 *   }
 * ]
 */
export function applyBlackFridayBogo(items = []) {
  // 1) Check if promo is active at all
  if (!isBlackFridayActive()) {
    return { discountCents: 0, breakdown: [] };
  }

  // 2) Flatten eligible units (one entry per unit in cart)
  const eligibleUnits = [];

  for (const item of items) {
    const slug = item.product?.slug;
    if (!slug || !isBlackFridayEligibleSlug(slug)) continue;

    const unitPrice = item.priceCents ?? 0;
    const qty = item.qty ?? 0;
    if (unitPrice <= 0 || qty <= 0) continue;

    for (let i = 0; i < qty; i++) {
      eligibleUnits.push({
        cartItemId: item.id,
        priceCents: unitPrice,
        slug,
      });
    }
  }

  if (eligibleUnits.length < 2) {
    // Not enough eligible items for BOGO
    return { discountCents: 0, breakdown: [] };
  }

  // 3) Sort by price DESC so each pair is [full-price, cheaper/equal half-off]
  eligibleUnits.sort((a, b) => b.priceCents - a.priceCents);

  let discountCents = 0;
  const breakdown = [];

  // 4) Pair up units: [0,1], [2,3], ...
  //    Apply 50% off to the *second* in each pair (the cheaper/equal one)
  for (let i = 0; i + 1 < eligibleUnits.length; i += 2) {
    const half = eligibleUnits[i + 1];

    const unitDiscount = Math.floor(half.priceCents * 0.5);
    discountCents += unitDiscount;

    breakdown.push({
      type: "BOGO_50",
      promoId: BLACK_FRIDAY_PROMO.id,
      discountedCartItemId: half.cartItemId,
      discountedSlug: half.slug,
      discountCents: unitDiscount,
    });
  }

  return { discountCents, breakdown };
}
