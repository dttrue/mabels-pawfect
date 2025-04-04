import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="py-10 text-center animate-fade-in">
      {/* Image First */}
      <div className="animate-fade-in">
        <img
          src="/images/hero.jpg"
          alt="Friendly dog and cat"
          className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
        />
      </div>

      {/* CTA Box Below */}
      <div className="mt-10 bg-pink-50 border border-pink-200 shadow rounded-lg px-4 py-6 max-w-md mx-auto text-center animate-fade-in">
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
      </div>
    </section>
  );
}
