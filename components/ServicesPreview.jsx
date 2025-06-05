import Link from "next/link";

export default function ServicesPreview() {
    return (
      <section className="py-16 px-4 text-center bg-white">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Services We Offer
        </h2>
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

        <div className="text-center mt-6">
          <p className="text-lg">Wondering what we charge?</p>
          <Link
            href="/services"
            className="inline-flex items-center gap-1 underline text-primary font-medium hover:text-pink-600 transition"
          >
            Check out our price list
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              →
            </span>
          </Link>
        </div>
      </section>
    );
}
