// components/dashboard/gallery/GalleryUploadForm.jsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function GalleryUploadForm({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file to upload.");

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("caption", caption);

    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      toast.success("✅ Image uploaded!");
      setFile(null);
      setCaption("");
      onUploadComplete?.();
    } catch (err) {
      console.error("[UPLOAD_ERROR]", err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 border rounded space-y-4 shadow-sm"
    >
      <h2 className="text-lg font-bold text-pinky-700">Upload New Pet Photo</h2>

      <input
        type="file"
        accept="image/*"
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-pinky-100 file:text-pinky-700 hover:file:bg-pinky-200"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <input
        type="text"
        placeholder="Optional caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full px-4 py-2 border rounded-md focus:ring-pinky-500"
      />

      <button
        type="submit"
        className="w-full bg-pinky-600 hover:bg-pinky-700 text-white font-medium py-2 px-4 rounded-md"
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
