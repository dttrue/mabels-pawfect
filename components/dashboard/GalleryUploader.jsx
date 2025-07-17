// components/dashboard/GalleryUploader.jsx

"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function GalleryUploader({ onUploadComplete }) {
  const [imageFile, setImageFile] = useState(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("HAPPY");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!imageFile) {
      toast.error("Please select an image");
      console.warn("🚫 No image selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET);

    setLoading(true);

    try {
      console.log("📤 Uploading to Cloudinary...");
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudData = await cloudRes.json();
      console.log("✅ Cloudinary response:", cloudData);

      if (!cloudData.secure_url || !cloudData.public_id) {
        throw new Error("Cloudinary upload failed");
      }

      const payload = {
        imageUrl: cloudData.secure_url,
        publicId: cloudData.public_id,
        altText,
        caption,
        category,
      };

      console.log("📦 Sending to DB:", payload);

      const dbRes = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dbResponseBody = await dbRes.text(); // catch even non-JSON errors
      console.log("📥 DB response status:", dbRes.status);
      console.log("📥 DB response body:", dbResponseBody);

      if (!dbRes.ok) throw new Error("DB insert failed");

      toast.success("Uploaded successfully!");
      setImageFile(null);
      setAltText("");
      setCaption("");
      onUploadComplete?.(); // Refresh the gallery if a callback is passed
    } catch (err) {
      console.error("🛑 Upload error:", err);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-4 border p-4 rounded bg-base-200">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />
      <input
        type="text"
        placeholder="Alt text"
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        className="input input-bordered w-full"
      />
      <input
        type="text"
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="input input-bordered w-full"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="select select-bordered w-full"
      >
        <option value="HAPPY">Happy Client</option>
        <option value="MEMORIAM">Memoriam</option>
      </select>
      <button
        className="btn btn-primary w-full"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
}
