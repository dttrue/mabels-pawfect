// components/newsletters/ClientNewsletterGallery.jsx

"use client";

import { useState } from "react";
import ImagePreviewModal from "@/components/modals/ImagePreviewModal";

export default function ClientNewsletterGallery({ newsletters }) {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      <div
        className={`grid gap-8 ${
          newsletters.length === 1
            ? "grid-cols-1 place-items-center"
            : "md:grid-cols-2"
        }`}
      >
        {newsletters.map((n) => (
          <div
            className="card bg-base-100 shadow-xl w-full max-w-xl mx-auto"
            key={n.id}
          >
            <figure>
              <img
                src={n.imageUrl}
                alt={n.title}
                className="w-full h-auto object-cover cursor-pointer hover:opacity-80 transition"
                onClick={() => {
                  console.log("🖼️ Preview triggered:", {
                    imageUrl: n.imageUrl,
                    altText: n.title,
                    caption: n.description,
                  });
                  setSelectedImage({
                    imageUrl: n.imageUrl,
                    altText: n.title,
                    caption: n.description,
                  });
                }}
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">{n.title}</h2>
              <p>{n.description}</p>
              {n.fileUrl && (
                <a
                  href={n.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent mt-4"
                >
                  📄 Download PDF
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <ImagePreviewModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}
