// components/dashboard/NewsletterAdminForm.jsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function NewsletterAdminForm({ onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    fileUrl: "",
    altText: "",
    keywords: "",
    publicId: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load Cloudinary widget if not already loaded
  useEffect(() => {
    if (!window.cloudinary) {
      const script = document.createElement("script");
      script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = () => {
    window.cloudinary?.openUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET,
        multiple: false,
        resourceType: "image",
      },
      (error, result) => {
        if (!error && result.event === "success") {
          setForm((prev) => ({
            ...prev,
            imageUrl: result.info.secure_url,
            publicId: result.info.public_id,
          }));
        }
      }
    );
  };

  const handlePdfUpload = () => {
    window.cloudinary?.openUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET,
        multiple: false,
        resourceType: "raw",
      },
      (error, result) => {
        if (!error && result.event === "success") {
          setForm((prev) => ({
            ...prev,
            fileUrl: result.info.secure_url,
          }));
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...form,
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
        imageUrl: "",
        fileUrl: "",
        altText: "",
        keywords: "",
        publicId: "",
        isActive: true,
      });
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
      <button
        type="button"
        onClick={handleImageUpload}
        className="btn btn-secondary w-full"
      >
        📤 Upload Image
      </button>
      {form.imageUrl && (
        <img
          src={form.imageUrl}
          alt="Newsletter preview"
          className="w-full h-48 object-cover rounded mt-2"
        />
      )}

      {/* PDF Upload */}
      <button
        type="button"
        onClick={handlePdfUpload}
        className="btn btn-outline w-full"
      >
        📄 Upload PDF (optional)
      </button>
      {form.fileUrl && (
        <p className="text-xs text-green-600 mt-1">PDF uploaded ✔️</p>
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


