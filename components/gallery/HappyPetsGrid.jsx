// components/HappyPetsGrid.jsx
"use client";
import { useEffect, useState } from "react";

export default function HappyPetsGrid() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch("/api/admin/gallery")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (img) => img.category === "HAPPY" && !img.deletedAt
        );
        setImages(filtered);
      })
      .catch((err) => {
        console.error("Failed to fetch gallery:", err);
      });
  }, []);

  return (
    <section className="bg-pinky-50 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-lg shadow-md"
            >
              <img
                src={image.imageUrl}
                alt={image.altText || "Happy pet"}
                className="w-full h-64 object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

