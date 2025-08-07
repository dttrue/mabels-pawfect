// components/dashboard/NewsletterAdminPanel.jsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import NewsletterAdminForm from "./NewsletterAdminForm";
import ToggleSection from "@/components/common/ToggleSection";
import Image from "next/image";

export default function NewsletterAdminPanel() {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNewsletters = async () => {
    try {
      const res = await axios.get("/api/newsletters");
      setNewsletters(res.data);
    } catch (err) {
      console.error("Failed to fetch newsletters:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this newsletter?")) return;
    try {
      await axios.delete("/api/admin/newsletters", { data: { id } });
      setNewsletters((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  useEffect(() => {
    fetchNewsletters();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">🛠️ Manage Newsletters</h1>

      <NewsletterAdminForm onSuccess={fetchNewsletters} />

      <hr className="my-8" />

      <h2 className="text-2xl font-semibold mb-4">📰 Existing Newsletters</h2>

      {loading ? (
        <p>Loading...</p>
      ) : newsletters.length === 0 ? (
        <p>No newsletters found.</p>
      ) : (
        <ToggleSection title="Current Newsletters">
          <ul className="space-y-4">
            {newsletters.map((n) => (
              <li
                key={n.id}
                className="border rounded-lg p-4 bg-base-200 shadow-sm flex flex-col sm:flex-row gap-4"
              >
                {n.imageUrl && (
                  <Image
                    src={n.imageUrl}
                    alt={n.altText || "Newsletter image"}
                    width={160}
                    height={200}
                    className="w-full sm:w-40 h-auto object-cover rounded"
                    loading="lazy"
                    priority={n.isFeatured}
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-lg">{n.title}</h3>
                      <p className="text-sm text-gray-600">{n.description}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="btn btn-sm btn-error"
                    >
                      🗑 Delete
                    </button>
                  </div>

                  {n.fileUrl && (
                    <a
                      href={n.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline inline-block"
                    >
                      📄 View PDF
                    </a>
                  )}

                  {n.keywords?.length > 0 && (
                    <p className="text-xs text-gray-500 italic">
                      Keywords: {n.keywords.join(", ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </ToggleSection>
      )}
    </div>
  );
}
