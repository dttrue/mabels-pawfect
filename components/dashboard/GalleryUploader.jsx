// components/dashboard/GalleryUploader.jsx
"use client";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function GalleryUploader({ onUploadComplete }) {
  const [imageFile, setImageFile] = useState(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("HAPPY");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState("");

  // 🚀 NEW: contest wiring
  const [contestMode, setContestMode] = useState(false);
  const [contestSlug, setContestSlug] = useState("halloween-2025");
  const [contestTitle, setContestTitle] = useState("");

  const MAX_KEYWORDS = 10;
  const MAX_ALT_LENGTH = 125;

  const filenameTitle = useMemo(() => {
    if (!imageFile?.name) return "";
    return humanize(imageFile.name);
  }, [imageFile]);

  const handleUpload = async () => {
    if (!imageFile) {
      toast.error("Please select an image");
      console.warn("🚫 No image selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET);

    // ✅ If contest mode, drop into a predictable Cloudinary folder
    if (contestMode) {
      const folder =
        process.env.NEXT_PUBLIC_CLOUDINARY_CONTEST_ROOT?.replace(/\/+$/, "") ||
        "pawfect/contest";
      formData.append("folder", `${folder}/${contestSlug}`);
      // Optional: use filename without extension as public_id for nicer URLs
      // formData.append("public_id", slugify(contestTitle || filenameTitle));
    }

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

      // 1) Save to your existing gallery DB
      const payload = {
        imageUrl: cloudData.secure_url,
        publicId: cloudData.public_id,
        altText,
        caption,
        category,
        keywords, // keep if your API supports it
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

      // 2) If Contest Mode, upsert a ContestEntry
      if (contestMode) {
        const title = (contestTitle || filenameTitle || "Untitled").trim();
        const r2 = await fetch(`/api/admin/contest/${contestSlug}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            publicId: cloudData.public_id,
          }),
        });
        const j2 = await r2.json().catch(() => ({}));
        console.log("🏁 Contest upsert:", r2.status, j2);
        if (!r2.ok) {
          throw new Error(j2?.error || "Contest entry failed");
        }
      }

      toast.success("Uploaded successfully!");
      // Reset UI
      setImageFile(null);
      setAltText("");
      setCaption("");
      setKeywords("");
      setContestTitle("");
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
        accept="image/*"
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

/* helpers */
function humanize(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
// function slugify(s) {
//   return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
// }
