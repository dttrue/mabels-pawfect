// components/dashboard/ShopUploader.jsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { uploadAdminAsset } from "@/lib/adminCloudinaryClient";

export default function ShopUploader({ onUploadComplete, productId }) {
  const [imageFile, setImageFile] = useState(null);
  const [alt, setAlt] = useState(""); // ← alt (schema)
  const [caption, setCaption] = useState("");
  const [keywordsText, setKeywordsText] = useState(""); // UI as CSV
  const [loading, setLoading] = useState(false);

  const MAX_KEYWORDS = 10;
  const MAX_ALT_LENGTH = 125;

  function parseKeywords(input) {
    return String(input || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, MAX_KEYWORDS);
  }

  async function handleUpload() {
    if (!imageFile) return toast.error("Please select an image");
    if (!alt.trim()) return toast.error("Alt text is required");
    if (alt.length > MAX_ALT_LENGTH) {
      return toast.error(`Alt text must be ≤ ${MAX_ALT_LENGTH} characters.`);
    }

    const keywords = parseKeywords(keywordsText);

    setLoading(true);
    try {
      const { proof } = await uploadAdminAsset(imageFile, "shop-image");
      const dbRes = await fetch("/api/admin/shop/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadProof: proof,
          alt: alt.trim(),
          caption: caption.trim(),
          keywords,
          productId: productId || null,
        }),
      });
      const body = await dbRes.json().catch(() => ({}));
      if (!dbRes.ok) throw new Error(body?.error || "DB insert failed");

      toast.success(
        productId ? "Image uploaded to product!" : "Image uploaded!"
      );

      // reset
      setImageFile(null);
      setAlt("");
      setCaption("");
      setKeywordsText("");
      onUploadComplete?.(body.image || body);
    } catch (err) {
      console.error("🛑 Shop upload error:", err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  const kwCount = parseKeywords(keywordsText).length;

  return (
    <div className="space-y-4 border p-4 rounded bg-base-200">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => setImageFile(e.target.files[0] || null)}
      />

      <input
        type="text"
        placeholder="Alt text (required)"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        maxLength={MAX_ALT_LENGTH}
        className="input input-bordered w-full"
      />
      <p
        className={`text-sm mt-1 ${
          alt.length > MAX_ALT_LENGTH * 0.9
            ? "text-red-500 font-semibold"
            : "text-gray-500"
        }`}
      >
        {alt.length} / {MAX_ALT_LENGTH} characters
      </p>

      <input
        type="text"
        name="keywords"
        value={keywordsText}
        onChange={(e) => setKeywordsText(e.target.value)}
        onBlur={() => setKeywordsText(parseKeywords(keywordsText).join(", "))}
        placeholder="e.g. donut, squeaky, small dog"
        className="input input-bordered w-full"
      />
      <p className="text-sm mt-1 text-gray-500">
        {kwCount} / {MAX_KEYWORDS} keywords
      </p>

      <input
        type="text"
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="input input-bordered w-full"
      />

      <button
        className="btn btn-primary w-full"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload Product Image"}
      </button>
    </div>
  );
}
