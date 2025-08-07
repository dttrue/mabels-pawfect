// components/newsletter/NewsletterCarousel.jsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NewsletterCarousel() {
  const [newsletters, setNewsletters] = useState([]);

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        const res = await fetch("/api/newsletters");
        const data = await res.json();
        setNewsletters(data);
      } catch (err) {
        console.error("Failed to load newsletters:", err);
      }
    };
    fetchNewsletters();
  }, []);

  if (newsletters.length === 0) {
    return null; // or a placeholder message
  }

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          📬 Latest Newsletters
        </h2>
        <div className="carousel w-full mt-8 space-x-4 overflow-x-auto flex snap-x snap-mandatory scroll-smooth">
          {newsletters.map((n) => (
            <Link
              key={n.id}
              href={`/newsletter/${n.id}`}
              className="snap-center w-80 shrink-0"
            >
              <div className="bg-pinky-50 rounded-lg shadow-md p-4 flex flex-col items-center hover:shadow-lg transition-shadow">
                <img
                  src={n.imageUrl}
                  alt={n.altText || n.title}
                  className="w-full h-48 object-cover rounded mb-4"
                />
                <h3 className="font-semibold text-lg mb-2">{n.title}</h3>
                {n.description && (
                  <p className="text-sm text-gray-600 mb-3">{n.description}</p>
                )}
                {n.fileUrl && (
                  <p className="text-xs text-pink-600">📄 PDF available</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
