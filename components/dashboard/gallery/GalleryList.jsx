// components/dashboard/gallery/GalleryList.jsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import ImagePreviewModal from "@/components/modals/ImagePreviewModal";

export default function GalleryList() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch("/api/admin/gallery");
        const data = await res.json();
        setImages(data);
      } catch (err) {
        toast.error("Failed to load gallery.");
        console.error("GALLERY_FETCH_ERROR", err);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  const isUndoable = (img) => {
    if (!img.deletedAt) return false;
    const deletedAt = new Date(img.deletedAt);
    const now = new Date();
    return now.getTime() - deletedAt.getTime() <= 15 * 60 * 1000;
  };

  const handleDelete = async (id) => {
    const confirmed = confirm("Are you sure you want to delete this image?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, deletedAt: new Date().toISOString() } : img
        )
      );

      toast.success("Image deleted. You can undo this for 15 minutes.");
    } catch (err) {
      console.error("[DELETE_IMAGE_ERROR]", err);
      toast.error("Failed to delete image.");
    }
  };

  const handleUndo = async (id) => {
    try {
      await fetch(`/api/admin/gallery/undo/${id}`, { method: "POST" });
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      setImages(data);
      toast.success("Image restored!");
    } catch (err) {
      toast.error("Failed to undo.");
    }
  };

  if (loading)
    return <p className="text-sm text-gray-500">Loading gallery...</p>;

  return (
    <>
      <button
        onClick={() => setShowDeleted((prev) => !prev)}
        className="text-sm underline text-pinky-700 mb-4"
      >
        {showDeleted ? "Hide Deleted Images" : "Show Deleted Images"}
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img) => {
          const undoable = isUndoable(img);
          if (img.deletedAt && !undoable && !showDeleted) return null;

          return (
            <div
              key={img.id}
              className={`relative group border rounded p-1 transition ${
                img.deletedAt ? "opacity-50 grayscale" : ""
              }`}
            >
              <Image
                src={img.imageUrl}
                alt={img.altText || "Gallery Image"}
                width={200}
                height={200}
                className="rounded w-full h-40 object-cover cursor-pointer"
                onClick={() => setSelectedImage(img)}
              />

              {img.caption && (
                <p className="mt-1 text-xs text-center text-gray-600">
                  {img.caption}
                </p>
              )}

              {!img.deletedAt && (
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-1 right-1 text-red-600 hover:text-red-800 text-sm"
                >
                  ✕
                </button>
              )}

              {undoable && (
                <div className="absolute bottom-1 left-0 right-0 text-center">
                  <button
                    onClick={() => handleUndo(img.id)}
                    className="text-xs text-pinky-700 underline"
                  >
                    Undo Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
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
