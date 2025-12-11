// components/admin/ContestUploader.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function ContestUploader({
  slug = "halloween-2025",
  maxEntries = 6,
  onUploadComplete,
}) {
  const [imageFile, setImageFile] = useState(null);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const MAX_ALT_LENGTH = 125;

  const filenameTitle = useMemo(
    () => (imageFile?.name ? humanize(imageFile.name) : ""),
    [imageFile]
  );

  // Optional: show how many entries exist to enforce a simple cap
  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/contest/${slug}/entries`, {
        cache: "no-store",
      });
      const j = await r.json().catch(() => ({}));
      setCount((j?.entries || []).length);
    })();
  }, [slug]);

  const remaining = Math.max(0, maxEntries - count);

  async function handleUpload() {
    if (!imageFile) return toast.error("Please select an image");
    if (remaining <= 0) return toast.error(`Max ${maxEntries} entries reached`);

    const form = new FormData();
    form.append("file", imageFile);
    form.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_CONTEST_PRESET
    );

    // Only needed if your preset isn’t hard-locking the folder
    const root = (
      process.env.NEXT_PUBLIC_CLOUDINARY_CONTEST_ROOT || "pawfect/contest"
    ).replace(/\/+$/, "");
    form.append("folder", `${root}/${slug}`);

    setLoading(true);
    try {
      // 1️⃣ Upload to Cloudinary
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload`,
        { method: "POST", body: form }
      );
      const cloudData = await cloudRes.json();
      if (!cloudRes.ok || !cloudData?.public_id) {
        throw new Error(
          cloudData?.error?.message || "Cloudinary upload failed"
        );
      }

      // ✅ Guard: ensure it went to the correct contest folder
      if (!cloudData?.public_id?.startsWith(`${root}/${slug}/`)) {
        console.warn(
          "⚠️ Contest upload landed in wrong folder:",
          cloudData.public_id
        );
        toast.error("Wrong Cloudinary preset/folder for contest uploads.");
        return;
      }

      // 2️⃣ Upsert ContestEntry (title + publicId)
      const safeTitle = (title || filenameTitle || "Untitled").trim();
      const r2 = await fetch(`/api/contest/${slug}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: safeTitle,
          publicId: cloudData.public_id,
        }),
      });
      const j2 = await r2.json().catch(() => ({}));
      if (!r2.ok) throw new Error(j2?.error || "Contest entry failed");

      toast.success(`Contest entry uploaded! View → /contest/${slug}/vote`);
      setImageFile(null);
      setTitle("");
      setAltText("");
      setCaption("");
      setCount((c) => c + 1);
      onUploadComplete?.(j2.entry);
    } catch (err) {
      console.error("🛑 Contest upload error:", err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="space-y-4 border p-4 rounded bg-base-200">
      <div className="text-sm opacity-70">
        Contest: <b>{slug}</b> · Entries: {count}/{maxEntries}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />

      <input
        type="text"
        placeholder="Title (defaults to filename)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-bordered w-full"
      />

      <input
        type="text"
        placeholder="Alt text (optional, for accessibility)"
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
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="input input-bordered w-full"
      />

      <button
        className="btn btn-primary w-full"
        onClick={handleUpload}
        disabled={loading || remaining <= 0}
      >
        {loading
          ? "Uploading..."
          : remaining <= 0
            ? "Limit reached"
            : "Upload Contest Image"}
      </button>
    </div>
  );
}

function humanize(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
