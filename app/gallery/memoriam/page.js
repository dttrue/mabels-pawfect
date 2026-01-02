// app/gallery/memoriam/page.jsx

import MemoriamCarousel from "@/components/gallery/MemoriamCarousel";
import Link from "next/link";

export default function MemoriamPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">
          In Loving Memory ❤️
        </h1>

        <p className="text-gray-500 mb-10 max-w-xl mx-auto">
          Honoring the pets who brought so much joy and are dearly missed.
        </p>

        <MemoriamCarousel />

        {/* Return link */}
        <div className="mt-12">
          <Link
            href="/gallery"
            className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-4"
          >
            ← Back to Happy Clients
          </Link>
        </div>
      </div>
    </main>
  );
}
