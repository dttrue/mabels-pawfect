// components/SeasonalSpecial.jsx

export default function SeasonalSpecial() {
  return (
    <section
      id="summer-specials"
      className="bg-base-100 py-8 px-4 max-w-2xl mx-auto rounded-xl border border-base-300 shadow-sm mt-10"
    >
      <h2 className="text-2xl font-bold text-center mb-4">
        🌞 Summer 2025 Specials
      </h2>
      <img
        src="/images/seasonal-pricing/2.png"
        alt="Summer 2025 Specials"
        className="w-full rounded-md shadow"
      />
      <p className="text-sm text-center text-gray-500 mt-2 italic">
        Valid May 12 – August 31, 2025 • Book 2+ services in the same week
      </p>
    </section>
  );
}
