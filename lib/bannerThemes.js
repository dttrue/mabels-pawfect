// lib/bannerThemes.js
const THEME_MAP = {
  halloween: {
    bg: "bg-[#1A1A1A]", // near-black
    fg: "text-[#FFE8B0]", // warm parchment
    accent: "bg-[#FF6A00]", // pumpkin orange
    pattern:
      "before:content-[''] before:absolute before:inset-0 before:opacity-10 before:pointer-events-none " +
      "before:bg-[radial-gradient(circle_at_10%_10%,#FF6A00_0%,transparent_30%)," +
      "radial-gradient(circle_at_90%_20%,#7C3AED_0%,transparent_25%)," +
      "radial-gradient(circle_at_30%_80%,#F59E0B_0%,transparent_30%)]",
    // ❌ no icon here
  },

  // 🍂 Thanksgiving theme
  thanksgiving: {
    bg: "bg-gradient-to-r from-[#3b1f0e] via-[#5a2e0f] to-[#3b1f0e]", // rich brown-orange gradient
    fg: "text-amber-100", // soft golden text
    accent: "bg-amber-500", // warm amber accent bar
    pattern:
      "before:content-[''] before:absolute before:inset-0 before:opacity-15 before:pointer-events-none " +
      "before:bg-[radial-gradient(circle_at_15%_20%,#ffb347_0%,transparent_30%)," +
      "radial-gradient(circle_at_85%_25%,#ffcc33_0%,transparent_25%)," +
      "radial-gradient(circle_at_40%_80%,#d97706_0%,transparent_30%)]",
  },

  fall: {
    bg: "bg-orange-100",
    fg: "text-orange-900",
    accent: "bg-amber-500",
    pattern: "",
  },

  winter: {
    bg: "bg-[#0b253b]",
    fg: "text-[#e6f3ff]",
    accent: "bg-sky-400",
    pattern: "",
  },

  // ❤️ Valentine’s theme
  valentines: {
    bg: "bg-gradient-to-r from-[#3a0313] via-[#4f0820] to-[#19000c]", // deep wine / berry gradient
    fg: "text-rose-50", // light text
    accent: "bg-rose-400", // CTA bar, ribbons, etc.
    pattern:
      "before:content-[''] before:absolute before:inset-0 before:opacity-20 before:pointer-events-none " +
      "before:bg-[radial-gradient(circle_at_15%_20%,#fb7185_0%,transparent_35%)," +
      "radial-gradient(circle_at_85%_25%,#f9a8d4_0%,transparent_30%)," +
      "radial-gradient(circle_at_40%_80%,#fecaca_0%,transparent_30%)]",
  },

  // Off-Season theme
  offSeason: {
    bg: "bg-white",
    fg: "text-pink-700",
    accent: "bg-pink-500",
    pattern: "",
  },

  // 🎄 Christmas theme
  christmas: {
    bg: "bg-gradient-to-r from-[#f7ede2] via-[#f3e2d5] to-[#f7ede2]",

    // ✔ readability
    fg: "text-neutral-900",

    accent: "bg-emerald-500",

    pattern:
      "before:content-[''] before:absolute before:inset-0 before:opacity-15 before:pointer-events-none " +
      "before:bg-[radial-gradient(circle_at_15%_20%,#ff8fa3_0%,transparent_35%)," +
      "radial-gradient(circle_at_85%_25%,#ffd1dc_0%,transparent_30%)," +
      "radial-gradient(circle_at_40%_80%,#7bf2a0_0%,transparent_30%)]",
  },
};

export default THEME_MAP;
