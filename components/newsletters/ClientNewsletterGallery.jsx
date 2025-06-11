// components/newsletters/ClientNewsletterGallery.jsx

"use client";

import { useState } from "react";
import ImagePreviewModal from "@/components/modals/ImagePreviewModal";

export default function ClientNewsletterGallery({ newsletters }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const isNew = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diff = now - created;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return diff < sevenDays;
  };

  return (
    <>
      <div
        className={`grid gap-10 px-4 sm:px-6 md:px-8 py-6 ${
          newsletters.length === 1
            ? "grid-cols-1 place-items-center"
            : "md:grid-cols-2"
        }`}
      >
        {newsletters.map((n, idx) => (
          <div
            key={n.id}
            className="card bg-base-100 shadow-xl w-full max-w-2xl mx-auto"
          >
            <figure>
              <img
                src={n.imageUrl}
                alt={n.title}
                className="w-full h-auto object-cover cursor-pointer hover:opacity-80 transition"
                onClick={() =>
                  setSelectedImage({
                    imageUrl: n.imageUrl,
                    altText: n.title,
                    caption: n.description,
                  })
                }
              />
            </figure>

            <div className="card-body px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="card-title text-lg sm:text-xl">{n.title}</h2>
                {isNew(n.createdAt) && (
                  <span className="badge badge-success text-xs">NEW</span>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-1">
                Posted on {new Date(n.createdAt).toLocaleDateString()}
              </p>

              {/* Optional Subheading */}
              <h3 className="text-md font-semibold text-primary mt-4 mb-2">
                📬 Newsletter Summary
              </h3>

              {/* Paragraph-friendly rendering */}
              <div className="text-sm sm:text-base leading-relaxed text-gray-800 space-y-4">
                {n.description.split("\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {n.fileUrl && (
                <a
                  href={n.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm mt-6"
                >
                  📄 View Full PDF
                </a>
              )}
            </div>

            {/* Divider between newsletters */}
            {idx < newsletters.length - 1 && (
              <hr className="mx-6 my-4 border-t border-base-200" />
            )}
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

