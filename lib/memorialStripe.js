// lib/memorialStripe.js

import Stripe from "stripe";

const secretKey = process.env.MEMORIAL_STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("Missing MEMORIAL_STRIPE_SECRET_KEY.");
}

const memorialStripe = new Stripe(secretKey, {
  apiVersion: "2025-03-31.basil",
});

export default memorialStripe;
