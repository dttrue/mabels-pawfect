// components/FullPriceList.jsx

export default function FullPriceList() {
  return (
    <section id="full-price-list" className="mt-16 max-w-2xl mx-auto px-4">
      <h2 className="text-2xl font-bold text-center mb-4">
        📋 Full Year-Round Price List
      </h2>
      <img
        src="/images/seasonal-pricing/1.png"
        alt="Standard Pet Care Price List"
        className="w-full rounded shadow"
      />
      <p className="text-center text-sm text-gray-500 mt-2 italic">
        Effective base pricing for dog and cat care services year-round.
      </p>
    </section>
  );
}
