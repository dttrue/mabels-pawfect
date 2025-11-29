// lib/blackFridayConfig.js

// ISO times so you can flip this on/off without redeploy later if needed
export const BLACK_FRIDAY_PROMO = {
  id: "BF2025_BOGO_50",
  active: true, // switch to false to kill the promo
  name: "Black Friday BOGO 50% Mix & Match",
  type: "BOGO_50",
  startsAt: new Date("2025-11-26T05:00:00Z"), // or whatever you want
  endsAt: new Date("2025-12-01T05:00:00Z"),
  // product slugs that are eligible for the promo
  eligibleSlugs: [
    "houndstone-sandwich-plush-dog-toy-with-treat-pockets",
    "houndstone-bacon-egg-cheese-durable-plush-dog-toy",
    "houndstone-baguette-plush-interactive-dog-toy",
    "cappuccino-saucer-interactive-plush-dog-toy-w-squeaker",
    "cheesy-bread-nosework-enrichment-toy",
    "grilled-lobster-nosework-toy",
    "pita-pocket-nosework-toy",
    "strawberry-mille-feuille-nosework-toy",
    "chewffon-crepe-snuffle-treat-puzzle-toy",
    "chewffon-burrito-snuffle-toy",
    "chewffon-strawberry-roll-cake-puzzle-toy",
    "chewffon-sausage-snuffle-toy",
    "chewffon-gift-box-treat-puzzle-toy", // BF-only special
  ],
  // optional flags for UI:
  bfOnlySlugs: ["chewffon-gift-box-treat-puzzle-toy"],
};
