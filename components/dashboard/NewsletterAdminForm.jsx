// components/dashboard/NewsletterAdminForm.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { uploadAdminAsset } from "@/lib/adminCloudinaryClient";

const MAX_NEWSLETTER_PDF_BYTES = 10_485_760;

export default function NewsletterAdminForm({ onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    altText: "",
    keywords: "",
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile]
  );

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      pdfFile &&
      (pdfFile.size <= 0 || pdfFile.size > MAX_NEWSLETTER_PDF_BYTES)
    ) {
      setMessage("❌ Newsletter PDFs must be 10 MiB or smaller.");
      return;
    }

    setLoading(true);

    try {
      if (!imageFile) throw new Error("Select a newsletter image");

      const imageUpload = await uploadAdminAsset(
        imageFile,
        "newsletter-image"
      );
      const pdfUpload = pdfFile
        ? await uploadAdminAsset(pdfFile, "newsletter-pdf")
        : null;
      const payload = {
        ...form,
        imageUploadProof: imageUpload.proof,
        pdfUploadProof: pdfUpload?.proof || null,
        keywords: form.keywords
          .split(",")
          .map((kw) => kw.trim())
          .filter((kw) => kw.length > 0),
      };

      await axios.post("/api/admin/newsletters", payload);
      setMessage("✅ Newsletter added!");
      setForm({
        title: "",
        description: "",
        altText: "",
        keywords: "",
        isActive: true,
      });
      setImageFile(null);
      setPdfFile(null);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to submit. Check your fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        required
        className="input input-bordered w-full"
      />

      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description"
        className="textarea textarea-bordered w-full"
      />

      <input
        name="altText"
        value={form.altText}
        onChange={handleChange}
        placeholder="Image alt text (for accessibility)"
        className="input input-bordered w-full"
      />

      {/* Image Upload */}
      <label className="btn btn-secondary w-full">
        📤 Choose Image
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => setImageFile(event.target.files?.[0] || null)}
          disabled={loading}
        />
      </label>
      {imagePreview && (
        <img
          src={imagePreview}
          alt="Newsletter preview"
          className="w-full h-48 object-cover rounded mt-2"
        />
      )}

      {/* PDF Upload */}
      <label className="btn btn-outline w-full">
        📄 Choose PDF (optional, up to 10 MiB)
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;

            if (
              file &&
              (file.size <= 0 || file.size > MAX_NEWSLETTER_PDF_BYTES)
            ) {
              setPdfFile(null);
              setMessage("❌ Newsletter PDFs must be 10 MiB or smaller.");
              event.target.value = "";
              return;
            }

            setPdfFile(file);
            setMessage("");
          }}
          disabled={loading}
        />
      </label>
      {pdfFile && (
        <p className="text-xs text-green-600 mt-1">{pdfFile.name} selected</p>
      )}

      {/* Keywords Input */}
      <input
        name="keywords"
        value={form.keywords}
        onChange={handleChange}
        placeholder="Keywords (comma separated)"
        className="input input-bordered w-full"
      />

      <label className="label cursor-pointer">
        <span className="label-text">Mark as Active</span>
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={handleChange}
          name="isActive"
          className="checkbox"
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? "Uploading..." : "Add Newsletter"}
      </button>

      {message && <p className="text-sm text-center">{message}</p>}
    </form>
  );
}
