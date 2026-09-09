// lib/memorialStripe.js

import Stripe from "stripe";

export class MemorialStripeConfigurationError extends Error {
  constructor() {
    super("Memorial payments are not configured.");
    this.name = "MemorialStripeConfigurationError";
  }
}

export function getMemorialStripe() {
  const secretKey = process.env.MEMORIAL_STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new MemorialStripeConfigurationError();
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-03-31.basil",
  });
}

export function isMemorialStripeProviderError(error) {
  return error instanceof Stripe.errors.StripeError;
}
