'use client';
import { useEffect, useState } from "react";
import memorials from "@/lib/memoriamData";


export default function MemoriamCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % memorials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const currentPet = memorials[currentIndex];

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="relative w-full max-w-xs mx-auto rounded-lg overflow-hidden shadow-md aspect-[4/5] bg-gray-100">
          <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
            <img
              src={currentPet.image}
              alt={currentPet.name}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-start items-center text-white px-4 pt-4">
              <h3 className="text-lg font-bold mb-1">{currentPet.name}</h3>
              {currentPet.tribute && (
                <p className="text-xs text-center italic text-pink-100">
                  {currentPet.tribute}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
