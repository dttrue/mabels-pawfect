// components/dashboard/HighlightUploader.jsx

"use client";
import { useRef, useState, useCallback, useMemo } from "react";

export default function HighlightUploader({
  defaultTitle = "Bacon’s First Birthday Party",
  defaultSlug = "bacons-first-birthday",
  onSaved,
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [slug, setSlug] = useState(defaultSlug);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const inputRef = useRef(null);

  const MAX_MB = 500;
  const MAX_BYTES = MAX_MB * 1024 * 1024;

  const onPick = useCallback(
    (f) => {
      if (!f) return;
      if (!f.type.startsWith("video/")) {
        setMsg("❌ Please select a video file (.mp4, .mov, etc.)");
        return;
      }
      if (f.size > MAX_BYTES) {
        setMsg(`❌ File too large. Max ${MAX_MB}MB`);
        return;
      }
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      if (!title || title === "Untitled")
        setTitle(f.name.replace(/\.[^.]+$/, ""));
      if (!slug) setSlug(slugify(f.name));
    },
    [MAX_BYTES, title, slug]
  );

  const onFileChange = useCallback(
    (e) => {
      const f = e.target.files?.[0];
      if (f) onPick(f);
    },
    [onPick]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0];
      if (f) onPick(f);
    },
    [onPick]
  );

  const onDragOver = useCallback((e) => e.preventDefault(), []);

  const posterHint = useMemo(() => {
    const name = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    if (!name || !slug) return "";
    return `https://res.cloudinary.com/${name}/video/upload/so_2/highlights/2025/${slug}.jpg`;
  }, [slug]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!file) return setMsg("❌ Select a video first");
    if (!title.trim() || !slug.trim())
      return setMsg("❌ Title and slug are required");

    setBusy(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("slug", slug.trim());
      form.append("file", file);

      console.log("[Uploader] Uploading to /api/admin/highlights/upload...");
      const upRes = await fetch("/api/admin/highlights/upload", {
        method: "POST",
        body: form,
      });
      console.log("[Uploader] upload status", upRes.status, upRes.statusText);
      const upText = await upRes.text(); // log raw text before parsing
      console.log("[Uploader] upload raw response:", upText);

      let upJson;
      try {
        upJson = JSON.parse(upText);
      } catch (err) {
        throw new Error("Upload route did not return valid JSON");
      }
      if (!upRes.ok || upJson.error)
        throw new Error(upJson.error || "Upload failed");

      console.log("[Uploader] Upload OK:", upJson);

      console.log("[Uploader] Saving to /api/admin/highlights...");
      const saveRes = await fetch("/api/admin/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...upJson, type: "video" }),
      });
      console.log("[Uploader] save status", saveRes.status, saveRes.statusText);
      const saveText = await saveRes.text();
      console.log("[Uploader] save raw response:", saveText);

      let saveJson;
      try {
        saveJson = JSON.parse(saveText);
      } catch (err) {
        throw new Error("Save route did not return valid JSON");
      }
      if (!saveRes.ok || saveJson.error)
        throw new Error(saveJson.error || "Save failed");

      setMsg(`✅ Saved highlight: ${saveJson.highlight?.title || title}`);
    } catch (err) {
      console.error("[Uploader] Error", err);
      setMsg("❌ " + (err?.message || "Something went wrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="form-control">
          <span className="label-text">Title</span>
          <input
            className="input input-bordered w-full"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug || slug === slugify(title))
                setSlug(slugify(e.target.value));
            }}
            placeholder="Bacon’s First Birthday Party"
            required
          />
        </label>
        <label className="form-control">
          <span className="label-text">Slug</span>
          <input
            className="input input-bordered w-full"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="bacons-first-birthday"
            required
          />
        </label>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="border-2 border-dashed rounded-2xl p-6 text-center bg-base-200/40 hover:bg-base-200 transition cursor-pointer"
        onClick={() => inputRef.current?.click()}
        title="Drop a video or click to choose"
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={onFileChange}
        />
        <div className="space-y-2">
          <p className="font-medium">
            Drop your video here, or click to choose
          </p>
          <p className="text-sm opacity-70">MP4 / MOV • up to {MAX_MB}MB</p>
          {file && (
            <p className="text-sm">
              Selected: <span className="font-mono">{file.name}</span> (
              {(file.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="rounded-2xl overflow-hidden bg-base-200">
          <video
            className="w-full h-auto"
            controls
            playsInline
            src={previewUrl}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={busy || !file}>
          {busy ? "Uploading…" : "Upload & Save"}
        </button>
        {posterHint && (
          <span className="text-xs opacity-70">
            Poster will be derived like:{" "}
            <span className="ml-1 font-mono break-all">{posterHint}</span>
          </span>
        )}
      </div>

      {msg && (
        <div
          className={`alert ${
            msg.startsWith("✅")
              ? "alert-success"
              : msg.startsWith("❌")
                ? "alert-error"
                : "alert-info"
          }`}
        >
          <span>{msg}</span>
        </div>
      )}
    </form>
  );
}

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
