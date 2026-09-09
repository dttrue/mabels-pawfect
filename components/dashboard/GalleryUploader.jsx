// components/dashboard/GalleryUploader.jsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { uploadAdminAsset } from "@/lib/adminCloudinaryClient";

export default function GalleryUploader({ onUploadComplete }) {
  const [imageFile, setImageFile] = useState(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("HAPPY");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState("");

  const MAX_KEYWORDS = 10;
  const MAX_ALT_LENGTH = 125;

  const handleUpload = async () => {
    if (!imageFile) {
      toast.error("Please select an image");
      console.warn("🚫 No image selected");
      return;
    }

    setLoading(true);

    try {
      const { proof } = await uploadAdminAsset(imageFile, "gallery-image");
      const dbRes = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadProof: proof,
          altText: altText.trim(),
          caption: caption.trim(),
          category,
          keywords,
        }),
      });

      const body = await dbRes.json().catch(() => ({}));
      if (!dbRes.ok) throw new Error(body?.error || "Upload failed");

      toast.success("Uploaded successfully!");
      // Reset UI
      setImageFile(null);
      setAltText("");
      setCaption("");
      setKeywords("");
      onUploadComplete?.(); // refresh gallery
    } catch (err) {
      console.error("🛑 Upload error:", err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 border p-4 rounded bg-base-200">
      {/* --- File picker --- */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => setImageFile(e.target.files[0])}
      />

      {/* Alt text */}
      <input
        type="text"
        placeholder="Alt text"
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        maxLength={MAX_ALT_LENGTH}
        className="input input-bordered w-full"
      />
      <p
        className={`text-sm mt-1 ${
          altText.length > MAX_ALT_LENGTH * 0.9
            ? "text-red-500 font-semibold"
            : "text-gray-500"
        }`}
      >
        {altText.length} / {MAX_ALT_LENGTH} characters
      </p>

      {/* Keywords */}
      <input
        type="text"
        name="keywords"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        onBlur={() => {
          const sanitized = keywords
            .split(",")
            .map((kw) => kw.trim().toLowerCase())
            .filter((kw) => kw.length > 0);
          if (sanitized.length > MAX_KEYWORDS) {
            alert(`⚠️ Max ${MAX_KEYWORDS} keywords allowed.`);
            setKeywords(sanitized.slice(0, MAX_KEYWORDS).join(", "));
          } else {
            setKeywords(sanitized.join(", "));
          }
        }}
        placeholder="e.g. happy, small dog, black lab"
        className="input input-bordered w-full"
      />
      <p
        className={`text-sm mt-1 ${
          keywords.split(",").filter(Boolean).length > MAX_KEYWORDS
            ? "text-red-500 font-semibold"
            : "text-gray-500"
        }`}
      >
        {keywords.split(",").filter(Boolean).length} / {MAX_KEYWORDS} keywords
      </p>

      {/* Caption */}
      <input
        type="text"
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="input input-bordered w-full"
      />

      {/* Category */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="select select-bordered w-full"
      >
        <option value="HAPPY">Happy Client</option>
        <option value="MEMORIAM">Memoriam</option>
      </select>

     

      {/* Submit */}
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
