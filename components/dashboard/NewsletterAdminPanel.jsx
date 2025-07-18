// components/dashboard/NewsletterAdminPanel.jsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import NewsletterAdminForm from "./NewsletterAdminForm";
import ToggleSection from "@/components/common/ToggleSection";

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
          {newsletters.length === 0 ? (
            <p>No newsletters found.</p>
          ) : (
            <ul className="space-y-4">
              {newsletters.map((n) => (
                <li key={n.id} className="border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{n.title}</h3>
                      <p className="text-sm text-gray-600">{n.description}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="btn btn-error btn-sm"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ToggleSection>
      )}
    </div>
  );
}
