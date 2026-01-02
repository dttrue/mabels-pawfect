import HappyPetsGrid from "@/components/gallery/HappyPetsGrid";
import SnowOverlay from "@/components/SnowOverlay";
import Link from "next/link";

export default function GalleryPage() {
  return (
    <main className="relative bg-white min-h-screen">
      <SnowOverlay />

      <section className="py-16 px-4 bg-pinky-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Happy Clients 🐶🐱
          </h2>

          <p className="text-gray-600 mb-12 max-w-xl mx-auto">
            A look at some of the wonderful pets we've cared for and loved.
          </p>

          <HappyPetsGrid />

          {/* Soft link to Memoriam */}
          <div className="mt-16">
            <Link
              href="/gallery/memoriam"
              className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 font-medium underline underline-offset-4"
            >
              View our Memorial Gallery ❤️
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}



