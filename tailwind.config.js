// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite-react/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pinky: {
          50: "#FDF2F8",
          100: "#FCE8F3",
          200: "#FAD1E8",
          300: "#F8B4D9",
          400: "#F17EB8",
          500: "#E74694",
          600: "#D61F69",
          700: "#BF125D",
          800: "#99154B",
          900: "#751A3D",
        },
      },
      backgroundImage: {
        "pink-gradient": "linear-gradient(to bottom, #ffffff, #FDF2F8)",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.25)", opacity: "0.7" },
        },
      },
      animation: {
        shimmer: "shimmer 1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
