// components/HappyPetsGrid.jsx
import happyPetImages from "@/lib/happyPetImagesData";

export default function HappyPetsGrid() {
  return (
    <section className="bg-pinky-50 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {happyPetImages.map((image, index) => (
            <div key={index} className="overflow-hidden rounded-lg shadow-md">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-64 object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
