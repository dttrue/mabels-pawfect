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
};

export default THEME_MAP;
