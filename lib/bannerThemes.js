// lib/bannerThemes.js
const THEME_MAP = {
  halloween: {
    bg: "bg-[#1A1A1A]",
    fg: "text-[#FFE8B0]",
    accent: "bg-[#FF6A00]",
    pattern:
      "before:content-[''] before:absolute before:inset-0 before:opacity-10 before:pointer-events-none " +
      "before:bg-[radial-gradient(circle_at_10%_10%,#FF6A00_0%,transparent_30%)," +
      "radial-gradient(circle_at_90%_20%,#7C3AED_0%,transparent_25%)," +
      "radial-gradient(circle_at_30%_80%,#F59E0B_0%,transparent_30%)]",
  },

  thanksgiving: {
    bg: "bg-gradient-to-r from-[#3b1f0e] via-[#5a2e0f] to-[#3b1f0e]",
    fg: "text-amber-100",
    accent: "bg-amber-500",
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

  renaissance: {
    bg: "bg-gradient-to-r from-[#f4ead8] via-[#fff7e8] to-[#f4ead8]",
    fg: "text-[#3a281a]",
    accent: "bg-[#8b5e34]",
    pattern: "",
  },

  valentines: {
    bg: "bg-gradient-to-r from-[#3a0313] via-[#4f0820] to-[#19000c]",
    fg: "text-rose-50",
    accent: "bg-rose-400",
    pattern:
      "before:content-[''] before:absolute before:inset-0 before:opacity-20 before:pointer-events-none " +
      "before:bg-[radial-gradient(circle_at_15%_20%,#fb7185_0%,transparent_35%)," +
      "radial-gradient(circle_at_85%_25%,#f9a8d4_0%,transparent_30%)," +
      "radial-gradient(circle_at_40%_80%,#fecaca_0%,transparent_30%)]",
  },

  stpatricks: {
    bg: "bg-gradient-to-r from-[#f0fdf4] via-[#dcfce7] to-[#f0fdf4]",
    fg: "text-emerald-900",
    accent: "bg-amber-400",
    pattern:
      "before:content-[''] before:absolute before:inset-0 before:opacity-20 before:pointer-events-none " +
      "before:bg-[radial-gradient(circle_at_15%_20%,#22c55e_0%,transparent_35%)," +
      "radial-gradient(circle_at_85%_25%,#bbf7d0_0%,transparent_30%)," +
      "radial-gradient(circle_at_40%_80%,#facc15_0%,transparent_30%)]",
  },

  easter: {
    bg: "bg-gradient-to-r from-[#fff7ed] via-[#fdf2f8] to-[#fefce8]",
    fg: "text-stone-900",
    accent: "bg-amber-300",
    pattern:
      "before:content-[''] before:absolute before:inset-0 before:opacity-20 before:pointer-events-none " +
      "before:bg-[radial-gradient(circle_at_15%_20%,#f9a8d4_0%,transparent_35%)," +
      "radial-gradient(circle_at_85%_25%,#fde68a_0%,transparent_30%)," +
      "radial-gradient(circle_at_40%_80%,#bfdbfe_0%,transparent_30%)]",
  },

  offSeason: {
    bg: "bg-white",
    fg: "text-pink-700",
    accent: "bg-pink-500",
    pattern: "",
  },

  christmas: {
    bg: "bg-gradient-to-r from-[#f7ede2] via-[#f3e2d5] to-[#f7ede2]",
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
