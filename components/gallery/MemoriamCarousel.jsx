// components/gallery/MemoriamCarousel.jsx

"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
export default function MemoriamCarousel() {
  const [memorials, setMemorials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch("/api/admin/gallery")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (img) => img.category === "MEMORIAM" && !img.deletedAt
        );
        setMemorials(filtered);
      });
  }, []);

  useEffect(() => {
    if (memorials.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % memorials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [memorials]);

  if (memorials.length === 0) return null;

  const currentPet = memorials[currentIndex];

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="relative w-full max-w-xs mx-auto rounded-lg overflow-hidden shadow-md aspect-[4/5] bg-gray-100">
          <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
            <Image
              src={currentPet.imageUrl}
              alt={currentPet.altText || currentPet.caption || "Memorial Pet"}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-start items-center text-white px-4 pt-4">
              <h3 className="text-lg font-bold mb-1">
                {currentPet.altText || "A Beloved Friend"}
              </h3>
              {currentPet.caption && (
                <p className="text-xs text-center italic text-pink-100">
                  {currentPet.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
