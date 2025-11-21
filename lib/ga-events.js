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
 * BOOKING EVENTS
 * =======================*/

export function trackBookingAttempt({ service, entriesCount, petsCount }) {
  trackEvent("booking_submit_attempt", {
    service: service || null,
    entries_count: entriesCount ?? null,
    pets_count: petsCount ?? null,
  });
}

export function trackBookingSuccess({ service, entriesCount, petsCount }) {
  trackEvent("booking_submit_success", {
    service: service || null,
    entries_count: entriesCount ?? null,
    pets_count: petsCount ?? null,
  });
}

export function trackBookingError({ service, entriesCount, petsCount, errorType }) {
  trackEvent("booking_submit_error", {
    service: service || null,
    entries_count: entriesCount ?? null,
    pets_count: petsCount ?? null,
    error_type: errorType || "unknown",
  });
}

export function trackBookingClearSavedInfo({ hadEntries, petsCount, hadService }) {
  trackEvent("booking_clear_saved_info", {
    had_entries: !!hadEntries,
    pets_count: petsCount ?? null,
    had_service_selected: !!hadService,
  });
}

/* =========================
 * BOOKING FORM FIELD TRACKING
 * =======================*/

// When the user focuses a field
export function trackFieldFocus(fieldName) {
  trackEvent("booking_field_focus", {
    field: fieldName || "unknown",
  });
}

// When the user completes a field (blur + not empty)
export function trackFieldComplete(fieldName) {
  trackEvent("booking_field_complete", {
    field: fieldName || "unknown",
  });
}

// When the user leaves a required field empty
export function trackFieldError(fieldName) {
  trackEvent("booking_field_error", {
    field: fieldName || "unknown",
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

/**
 * Add to cart from anywhere (grid, PDP, related products, etc.)
 */
export function trackAddToCart({
  productId,
  title,
  price,
  variant,
  category,
  inventoryRemaining,
  location,
} = {}) {
  trackEvent("add_to_cart", {
    item_id: productId || null,
    item_name: title || null,
    price: typeof price === "number" ? price : null,
    variant: variant || null,
    category: category || null,
    stock_remaining:
      typeof inventoryRemaining === "number" ? inventoryRemaining : null,
    is_low_stock:
      typeof inventoryRemaining === "number"
        ? inventoryRemaining <= 3 // tweak threshold if you want
        : null,
    location: location || "shop_grid",
  });
}


/**
 * Cart opened (drawer / page view)
 */
export function trackCartView({ itemsCount, total } = {}) {
  trackEvent("cart_view", {
    items_count: typeof itemsCount === "number" ? itemsCount : null,
    total: typeof total === "number" ? total : null,
  });
}

/**
 * Item removed from cart
 */
export function trackCartRemoveItem({
  productId,
  variantId,
  quantity,
  reason, // "remove_button" | "qty_zero" | "replace_item" | etc.
} = {}) {
  trackEvent("cart_remove_item", {
    product_id: productId || null,
    variant_id: variantId || null,
    quantity: typeof quantity === "number" ? quantity : null,
    reason: reason || null,
  });
}

/**
 * Quantity changed for a cart line item
 */
export function trackCartChangeQty({
  productId,
  variantId,
  quantityBefore,
  quantityAfter,
} = {}) {
  trackEvent("cart_change_qty", {
    product_id: productId || null,
    variant_id: variantId || null,
    quantity_before:
      typeof quantityBefore === "number" ? quantityBefore : null,
    quantity_after:
      typeof quantityAfter === "number" ? quantityAfter : null,
  });
}

/**
 * User shows signs of abandoning cart (e.g. idle with cart open)
 */
export function trackCartAbandonStart({ itemsCount, total } = {}) {
  trackEvent("cart_abandon_start", {
    items_count: typeof itemsCount === "number" ? itemsCount : null,
    total: typeof total === "number" ? total : null,
  });
}

/**
 * Checkout started (we can keep the name for compatibility)
 */
export function trackBeginCheckout({
  itemsCount,
  total,
  deviceType,
  shippingZipPrefix,
  customerType, // "new" | "returning" | null
} = {}) {
  trackEvent("checkout_start", {
    items_count: typeof itemsCount === "number" ? itemsCount : null,
    total: typeof total === "number" ? total : null,
    device_type: deviceType || null,
    shipping_zip_prefix: shippingZipPrefix || null,
    customer_type: customerType || null,
  });
}

/**
 * Shipping step submitted
 */
export function trackCheckoutShippingSubmitted({
  shippingMethod,
  country,
  postalPrefix,
} = {}) {
  trackEvent("checkout_shipping_submitted", {
    shipping_method: shippingMethod || null,
    country: country || null,
    postal_prefix: postalPrefix || null,
  });
}

/**
 * Payment step submitted
 */
export function trackCheckoutPaymentSubmitted({ paymentMethod } = {}) {
  trackEvent("checkout_payment_submitted", {
    payment_method: paymentMethod || null, // "card", "apple_pay", etc.
  });
}

/**
 * Checkout abandoned (e.g. user bounced mid-funnel)
 */
export function trackCheckoutAbandon({
  step, // "shipping" | "payment" | "review"
  itemsCount,
  total,
} = {}) {
  trackEvent("checkout_abandon", {
    step: step || null,
    items_count: typeof itemsCount === "number" ? itemsCount : null,
    total: typeof total === "number" ? total : null,
  });
}

/**
 * Stripe webhook → purchase complete
 */
export function trackPurchaseComplete({
  orderId,
  total,
  currency,
  subtotal,
  tax,
  shipping,
  discount,
  promoCode,
  customerType, // "new" | "returning"
  itemsCount,
} = {}) {
  trackEvent("purchase_complete", {
    order_id: orderId || null,
    value: typeof total === "number" ? total : null,
    currency: currency || "USD",

    subtotal: typeof subtotal === "number" ? subtotal : null,
    tax: typeof tax === "number" ? tax : null,
    shipping: typeof shipping === "number" ? shipping : null,
    discount: typeof discount === "number" ? discount : null,

    promo_code: promoCode || null,
    customer_type: customerType || null,
    items_count: typeof itemsCount === "number" ? itemsCount : null,
  });
}


/* =========================
 * FOOTER
 * =======================*/

// Footer → Internal navigation links (About, Contact)
export function trackFooterLink({ label, url }) {
  trackEvent("footer_cta_click", {
    cta_type: label,
    destination: url,
    location: "footer",
  });
}
