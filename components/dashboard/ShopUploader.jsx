// components/dashboard/ShopUploader.jsx
"use client";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function ShopUploader({ onUploadComplete, productId }) {
  const [imageFile, setImageFile] = useState(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState("");

  const MAX_KEYWORDS = 10;
  const MAX_ALT_LENGTH = 125;

  const filenameTitle = useMemo(
    () => (imageFile?.name ? humanize(imageFile.name) : ""),
    [imageFile]
  );

  async function handleUpload() {
    if (!imageFile) {
      toast.error("Please select an image");
      return;
    }

    console.log("🚀 ENV DEBUG:", {
      cloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD,
      preset: process.env.NEXT_PUBLIC_CLOUDINARY_SHOP_PRESET,
    });

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_SHOP_PRESET
    );

    // Keep shop assets organized
    const root = (
      process.env.NEXT_PUBLIC_CLOUDINARY_SHOP_ROOT || "pawfect/shop/products"
    ).replace(/\/+$/, "");
    formData.append("folder", root);

    // Optional: deterministic public_id from filename
    // comment this out if you want Cloudinary’s random IDs
    formData.append(
      "public_id",
      `${root}/${slugify(filenameTitle || "image")}`
    );

    setLoading(true);
    try {
      // 1) Upload to Cloudinary (UNSIGNED)
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload`,
        { method: "POST", body: formData }
      );
      console.log("📤 Cloudinary response:", cloudRes);
      const cloudData = await cloudRes.json();
      console.log("✅ Cloudinary response:", cloudData);

      if (!cloudRes.ok || !cloudData?.public_id || !cloudData?.secure_url) {
        throw new Error(
          cloudData?.error?.message || "Cloudinary upload failed"
        );
      }

      // 2) Persist to DB
      const payload = {
        imageUrl: cloudData.secure_url,
        publicId: cloudData.public_id, // preferred for <CldImage>
        altText,
        caption,
        keywords, // keep if you later store these
        productId: productId || undefined, // optional link to a product
      };

      const dbRes = await fetch("/api/admin/shop/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await dbRes.json().catch(() => ({}));
      if (!dbRes.ok) throw new Error(body?.error || "DB insert failed");

      toast.success("Product image uploaded!");
      setImageFile(null);
      setAltText("");
      setCaption("");
      setKeywords("");
      onUploadComplete?.(body.image || body);
    } catch (err) {
      console.error("🛑 Shop upload error:", err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

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

      <input
        type="text"
        name="keywords"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        onBlur={() => {
          const sanitized = keywords
            .split(",")
            .map((kw) => kw.trim().toLowerCase())
            .filter(Boolean);
          if (sanitized.length > MAX_KEYWORDS) {
            alert(`⚠️ Max ${MAX_KEYWORDS} keywords allowed.`);
            setKeywords(sanitized.slice(0, MAX_KEYWORDS).join(", "));
          } else {
            setKeywords(sanitized.join(", "));
          }
        }}
        placeholder="e.g. durable, squeaky, small dog"
        className="input input-bordered w-full"
      />
      <p className="text-sm mt-1 text-gray-500">
        {keywords.split(",").filter(Boolean).length} / {MAX_KEYWORDS} keywords
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
