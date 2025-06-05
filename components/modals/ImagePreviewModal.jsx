// components/modals/ImagePreviewModal.jsx

"use client";


export default function ImagePreviewModal({ image, onClose }) {
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-base-200 p-4 rounded shadow-lg max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2 text-center">{image.altText}</h2>
        <p className="text-sm text-center text-gray-500 italic mb-4">
          {image.caption}
        </p>

        <img
          src={image.imageUrl}
          alt={image.altText || "Newsletter Image"}
          className="rounded w-full max-h-[80vh] object-contain"
        />

        {image.altText && (
          <p className="text-sm text-center text-gray-600 italic">
            {image.altText}
          </p>
        )}
        {image.caption && (
          <p className="text-sm text-center text-gray-600 mt-1">
            {image.caption}
          </p>
        )}
      </div>
    </div>
  );
}
