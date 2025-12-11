// components/dashboard/SiteImageUploader.jsx
"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";

const MAX_KEYWORDS = 10;
const MAX_ALT_LENGTH = 125;

export default function SiteImageUploader({
  defaultKey = "",
  onUploadComplete,
}) {
  const [imageFile, setImageFile] = useState(null);
  const [key, setKey] = useState(defaultKey);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!key.trim()) return toast.error("Key is required (e.g. hero-main)");
    if (!alt.trim()) return toast.error("Alt text is required");
    if (alt.length > MAX_ALT_LENGTH) {
      return toast.error(`Alt text must be ≤ ${MAX_ALT_LENGTH} characters.`);
    }

    const keywords = parseKeywords(keywordsText);

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_SITE_PRESET
    );

    const root = (
      process.env.NEXT_PUBLIC_CLOUDINARY_SITE_ROOT || "pawfect/site/assets"
    ).replace(/\/+$/, "");

    const baseSlug = slugify(filenameTitle || key || "image") || "image";
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

      const payload = {
        key: key.trim(),
        imageUrl: cloudData.secure_url,
        publicId: cloudData.public_id,
        alt: alt.trim(),
        caption: caption.trim() || null,
        keywords,
      };

      const dbRes = await fetch("/api/admin/site-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await dbRes.json().catch(() => ({}));
      if (!dbRes.ok) throw new Error(body?.error || "DB insert failed");

      toast.success(`Site image "${key}" saved!`);

      setImageFile(null);
      setAlt("");
      setCaption("");
      setKeywordsText("");
      onUploadComplete?.(body.image || body);
    } catch (err) {
      console.error("🛑 Site upload error:", err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  const kwCount = parseKeywords(keywordsText).length;

  return (
    <div className="space-y-4 border p-4 rounded bg-base-200">
      <label className="block text-sm font-semibold">Key (stable ID)</label>

      <div className="flex gap-2">
        <select
          className="select select-bordered w-1/3"
          onChange={(e) => setKey(e.target.value)}
        >
          <option value="">Select preset…</option>
          <option value="hero-main">Hero Image</option>
          <option value="logo-main">Navbar Logo</option>
          <option value="about-me">About Page Photo</option>
          <option value="badge-pet-cpr">CPR Certification Badge</option>
          <option value="pricing-flyer-main">Seasonal Pricing Flyer</option>
          <option value="announcement-main">Homepage Announcement Image</option>
        </select>

        <input
          type="text"
          placeholder='Or enter custom key ("summer-hero-2026")'
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

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
        placeholder="e.g. christmas, hero, dog, cat"
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
        {loading ? "Uploading..." : "Upload Site Image"}
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
