// components/HeroSection.jsx
import Link from "next/link";

export default function HeroSection({ isSummer }) {
  return (
    <section className="py-10 text-center animate-fade-in">
      {/* Image First */}
      <div className="animate-fade-in">
        <img
          src="/images/thanksgiving_hero-2025.jpg"
          alt="Friendly dog and cat"
          className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
        />
      </div>

      {/* CTA Box Below */}
      <div className="mt-10 bg-pink-50 border border-pink-200 shadow rounded-lg px-4 py-6 max-w-md mx-auto text-center animate-fade-in hover:animate-pulse transition">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-gray-900 mb-4">
          Caring for Your Pets <br />
          Like They’re <span className="italic text-pink-600">Family</span> 🐾
        </h1>

        <p className="text-base sm:text-lg text-gray-600 mb-6">
          Personalized, loving care for your dogs and cats while you're away.
        </p>

        <Link href="/booking">
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition duration-200">
            Book Now
          </button>
        </Link>

        <p className="mt-2 text-xs text-gray-500">Takes less than 1 minute</p>

        {isSummer && (
          <a
            href="#summer-specials"
            className="inline-block mt-6 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-full shadow transition"
          >
            🌞 See Summer Specials
          </a>
        )}
      </div>
    </section>
  );
}
