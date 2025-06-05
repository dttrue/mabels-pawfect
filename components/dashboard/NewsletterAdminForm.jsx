// components/dashboard/NewsletterAdminForm.jsx
"use client";

import { useState } from "react";
import axios from "axios";

export default function NewsletterAdminForm({ onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    fileUrl: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await axios.post("/api/admin/newsletters", form);
      setMessage("✅ Newsletter added!");
      setForm({
        title: "",
        description: "",
        imageUrl: "",
        fileUrl: "",
        isActive: true,
      });
      onSuccess?.();
    } catch (err) {
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
        name="imageUrl"
        value={form.imageUrl}
        onChange={handleChange}
        placeholder="Image URL"
        required
        className="input input-bordered w-full"
      />
      <input
        name="fileUrl"
        value={form.fileUrl}
        onChange={handleChange}
        placeholder="PDF File URL (optional)"
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
