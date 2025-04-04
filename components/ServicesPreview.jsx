import Link from "next/link";

export default function ServicesPreview() {
    return (
      <section className="py-16 px-4 text-center bg-white">
  <h2 className="text-3xl font-bold text-gray-900 mb-8">Services We Offer</h2>
  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto">
    {/* Dog Walking */}
    <div className="bg-pink-50 rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="text-4xl mb-4">🐕</div>
      <h3 className="text-xl font-semibold mb-2">Dog Walking</h3>
      <p className="text-sm text-gray-600">
        Regular walks and exercise to keep your pup healthy and happy.
      </p>
    </div>

    {/* Pet Sitting */}
    <div className="bg-pink-50 rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="text-4xl mb-4">🏡</div>
      <h3 className="text-xl font-semibold mb-2">Pet Sitting</h3>
      <p className="text-sm text-gray-600">
        In-home care for dogs and cats while you’re away — stress-free!
      </p>
    </div>

    {/* Drop-In Visits */}
    <div className="bg-pink-50 rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="text-4xl mb-4">🕒</div>
      <h3 className="text-xl font-semibold mb-2">Drop-In Visits</h3>
      <p className="text-sm text-gray-600">
        Quick check-ins for feeding, playtime, or potty breaks.
      </p>
    </div>
  </div>

  <Link href="/services">
    <button className="mt-10 bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-lg shadow">
      View All Services
    </button>
  </Link>
</section>
    );
}
