// lib/ga-events.js

import { GA_ID } from "./ga";

// Low-level guard around window.gtag
function safeGtag(eventName, params = {}) {
  if (typeof window === "undefined") return; // SSR guard
  if (!window.gtag || !GA_ID) return;
  window.gtag("event", eventName, params);
}

// Generic helper if you ever want to fire arbitrary events
export function trackEvent(eventName, params = {}) {
  safeGtag(eventName, params);
}

/* =========================
 * GALLERY
 * =======================*/

export function trackGalleryImageOpen({ imageId, imageUrl, altText, index }) {
  trackEvent("gallery_image_open", {
    image_id: imageId,
    image_url: imageUrl,
    alt_text: altText || "unknown",
    index: typeof index === "number" ? index : null,
  });
}

/* =========================
 * CONTACT
 * =======================*/

export function trackContactFormSubmit({ hasMessage } = {}) {
  trackEvent("contact_form_submit", {
    has_message: typeof hasMessage === "boolean" ? hasMessage : null,
  });
}

/* =========================
 * BOOKING / CTAs
 * =======================*/

// Main booking CTA (navbar, hero, pricing, etc.)
export function trackBookingCTA({ page, location } = {}) {
  trackEvent("booking_cta_click", {
    page: page || null, // e.g. "homepage", "navbar", "pricing"
    location: location || null, // e.g. "navbar", "hero", "footer"
  });
}

// Optional: more detailed booking events later
export function trackBookingFormStart({ serviceType } = {}) {
  trackEvent("booking_form_start", {
    service_type: serviceType || null,
  });
}

export function trackBookingFormSubmit({ serviceType } = {}) {
  trackEvent("booking_form_submit", {
    service_type: serviceType || null,
  });
}

/* =========================
 * HOMEPAGE CTAs
 * =======================*/

// Hero “Book Now”
export function trackHeroBookNow() {
  trackBookingCTA({ page: "homepage", location: "hero" });
}

// “See Holiday Pricing” on homepage
// “See Holiday Pricing” CTA
export function trackPricingCTA({ page = "homepage", location } = {}) {
  trackEvent("pricing_cta_click", {
    page,
    location: location || null, // e.g. "banner", "navbar", etc.
  });
}


// “See Our Happy Pets” / gallery CTA from homepage
export function trackGalleryCTA({ page = "homepage" } = {}) {
  trackEvent("gallery_cta_click", {
    page,
  });
}

/* =========================
 * NAVBAR / SHOP / DONATIONS
 * =======================*/

// Shop nav click (from navbar)
export function trackShopNavClick({ page = "navbar" } = {}) {
  trackEvent("shop_nav_click", {
    page,
  });
}

// Donations CTA (navbar, footer, page)
export function trackDonationCTA({ page, location } = {}) {
  trackEvent("donate_cta_click", {
    page: page || null,
    location: location || null,
  });
}

/* =========================
 * NEWSLETTER
 * =======================*/

export function trackNewsletterView({
  newsletterId,
  location = "carousel",
} = {}) {
  trackEvent("newsletter_view", {
    newsletter_id: newsletterId || null,
    location,
  });
}

export function trackNewsletterCTA({
  newsletterId,
  ctaType,
  location = "carousel",
} = {}) {
  trackEvent("newsletter_cta_click", {
    newsletter_id: newsletterId || null,
    cta_type: ctaType || "unknown",
    location,
  });
}




/* =========================
 * SHOP / CART / CHECKOUT
 * =======================*/

export function trackAddToCart({ productId, title, price, variant }) {
  trackEvent("add_to_cart", {
    item_id: productId,
    item_name: title,
    price: price, // number (not cents)
    variant: variant || null,
  });
}

export function trackBeginCheckout({ itemsCount, total } = {}) {
  trackEvent("begin_checkout", {
    items_count: typeof itemsCount === "number" ? itemsCount : null,
    total: typeof total === "number" ? total : null,
  });
}

// Later when Stripe purchase is wired:
export function trackPurchaseComplete({
  orderId,
  total,
  currency,
  items,
} = {}) {
  trackEvent("purchase_complete", {
    order_id: orderId || null,
    value: typeof total === "number" ? total : null,
    currency: currency || "USD",
    // You can add more structure later (GA supports item list params)
  });
}
