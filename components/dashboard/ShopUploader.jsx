// components/dashboard/ShopUploader.jsx
"use client";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function ShopUploader({ onUploadComplete, productId }) {
  const [imageFile, setImageFile] = useState(null);
  const [alt, setAlt] = useState(""); // ← alt (schema)
  const [caption, setCaption] = useState("");
  const [keywordsText, setKeywordsText] = useState(""); // UI as CSV
  const [loading, setLoading] = useState(false);

  const MAX_KEYWORDS = 10;
  const MAX_ALT_LENGTH = 125;

  const filenameTitle = useMemo(
    () => (imageFile?.name ? humanize(imageFile.name) : ""),
    [imageFile]
  );

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

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_SHOP_PRESET
    );

    const root = (
      process.env.NEXT_PUBLIC_CLOUDINARY_SHOP_ROOT || "pawfect/shop/products"
    ).replace(/\/+$/, "");

    // ✅ make public_id unique & safe
    const baseSlug = slugify(filenameTitle || "image") || "image";
    const stamp = Date.now();
    const publicId = `${root}/${baseSlug}-${stamp}`;

    formData.append("folder", root);
    formData.append("public_id", publicId);

    setLoading(true);
    try {
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload`,
        { method: "POST", body: formData }
      );
      const cloudData = await cloudRes.json();

      if (!cloudRes.ok || !cloudData?.public_id || !cloudData?.secure_url) {
        throw new Error(
          cloudData?.error?.message || "Cloudinary upload failed"
        );
      }

      // --- Persist in DB ---
      const payload = {
        imageUrl: cloudData.secure_url,
        publicId: cloudData.public_id,
        alt: alt.trim(),
        caption: caption.trim() || null,
        keywords,
        productId: productId || undefined,
      };

      const dbRes = await fetch("/api/admin/shop/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        accept="image/*"
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

/* helpers */
function humanize(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
