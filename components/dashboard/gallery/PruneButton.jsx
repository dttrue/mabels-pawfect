"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function PruneButton() {
  const [loading, setLoading] = useState(false);

  const handlePrune = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gallery/prune", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Prune failed.");
      } else {
        toast.success(data.message || "Prune complete!");
      }
    } catch (err) {
      console.error("❌ Prune error:", err);
      toast.error("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePrune}
      className="btn btn-outline btn-sm"
      disabled={loading}
    >
      {loading ? "Pruning..." : "🧹 Prune Expired Images"}
    </button>
  );
}
