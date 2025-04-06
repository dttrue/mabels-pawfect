import HappyPetsGrid from "@/components/gallery/HappyPetsGrid";
import MemoriamCarousel from "@/components/gallery/MemoriamCarousel";

export default function GalleryPage() {
  return (
    <main className="bg-white min-h-screen">
      {/* Top: Happy Pets */}
      <section className="py-16 px-4 bg-pinky-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Happy Clients 🐶🐱
          </h2>
          <p className="text-gray-600 mb-12 max-w-xl mx-auto">
            A look at some of the wonderful pets we've cared for and loved.
          </p>
          <HappyPetsGrid />
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-12 bg-gradient-to-b from-pinky-50 to-white flex items-center justify-center">
        <span className="text-pink-400 text-2xl">🐾</span>
      </div>

      {/* Bottom: Memoriam Carousel */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            In Loving Memory ❤️
          </h2>
          <p className="text-gray-500 mb-8">
            Honoring the pets who brought so much joy and are dearly missed.
          </p>
          <MemoriamCarousel />
        </div>
      </section>
    </main>
  );

}
