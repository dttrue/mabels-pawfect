// lib/summerSaleHelpers.js

import { SUMMER_TOY_CLEAROUT } from "@/lib/summerSaleConfig";

export function isSummerSaleActive() {
  return process.env.ENABLE_SUMMER_TOY_CLEAROUT === "true";
}

export function getSummerSalePriceCents(slug, originalPriceCents) {
  if (!slug) return null;

  const salePrice = SUMMER_TOY_CLEAROUT.salePriceBySlug?.[slug];

  if (
    Number.isInteger(salePrice) &&
    salePrice > 0 &&
    salePrice < originalPriceCents
  ) {
    return salePrice;
  }

  return null;
}

export function isSummerSaleEligibleSlug(slug, originalPriceCents) {
  return Boolean(getSummerSalePriceCents(slug, originalPriceCents));
}
