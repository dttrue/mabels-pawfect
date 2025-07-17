// components/dashboard/NewsletterDashboard.jsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import NewsletterAdminForm from "@/components/dashboard/NewsletterAdminForm";
import ImagePreviewModal from "@/components/modals/ImagePreviewModal";
import OvernightBlocker from "@/components/dashboard/OvernightBlocker";
import GalleryDashboard from "@/components/dashboard/GalleryDashboard";


export default function AdminDashboard() {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);


  const fetchNewsletters = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/newsletters"); // fetch all active ones
      setNewsletters(res.data);
    } catch (err) {
      console.error("Failed to fetch newsletters:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteNewsletter = async (id) => {
    if (!confirm("Are you sure you want to delete this newsletter?")) return;

    try {
      setDeleting(id);
      await axios.delete("/api/admin/newsletters", {
        data: { id },
      });
      setNewsletters((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchNewsletters();
  }, []);

  return (
    <div className="space-y-12 max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center">🛠️ Admin Dashboard</h1>

      <NewsletterAdminForm onSuccess={fetchNewsletters} />

      <div>
        <h2 className="text-xl font-semibold mb-4">📋 Current Newsletters</h2>
        {loading ? (
          <p>Loading...</p>
        ) : newsletters.length === 0 ? (
          <p className="text-gray-500">No newsletters yet.</p>
        ) : (
          <ul className="space-y-4">
            {newsletters.map((n) => (
              <li
                key={n.id}
                className="flex items-center gap-4 p-4 border rounded-lg bg-base-100 shadow-sm"
              >
                <img
                  src={n.imageUrl}
                  alt={n.title}
                  className="w-24 h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                  onClick={() =>
                    setPreviewImage({
                      imageUrl: n.imageUrl,
                      altText: n.title,
                      caption: n.description,
                    })
                  }
                />

                <div className="flex-1">
                  <h3 className="font-bold">{n.title}</h3>
                  <p className="text-sm text-gray-600">{n.description}</p>
                </div>
                <button
                  onClick={() => deleteNewsletter(n.id)}
                  disabled={deleting === n.id}
                  className="btn btn-error btn-sm"
                >
                  {deleting === n.id ? "Deleting..." : "🗑 Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {previewImage && (
        <ImagePreviewModal
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* NEW Overnight blocking tool */}
      <OvernightBlocker />

      {/* NEW Gallery Manager Section */}
      <div className="mt-16 border-t pt-12">
        <h2 className="text-xl font-semibold mb-4 text-center">
          📸 Manage Gallery
        </h2>
        <GalleryDashboard />
      </div>
    </div>
  );
}
