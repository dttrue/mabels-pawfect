// components/admin/ContestUploader.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { uploadAdminAsset } from "@/lib/adminCloudinaryClient";

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

    setLoading(true);
    try {
      const { proof } = await uploadAdminAsset(imageFile, "contest-image", {
        contestSlug: slug,
      });
      const r2 = await fetch(`/api/contest/${slug}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: (title || filenameTitle || "Untitled").trim(),
          uploadProof: proof,
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
        accept="image/jpeg,image/png,image/webp"
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
