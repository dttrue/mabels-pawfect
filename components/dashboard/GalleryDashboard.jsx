// components/dashboard/GalleryDashboard.jsx
"use client";

import { useState } from "react";
import GalleryList from "@/components/dashboard/gallery/GalleryList";
import PendingMemorialList from "@/components/dashboard/gallery/PendingMemorialList";
import GalleryUploader from "@/components/dashboard/GalleryUploader";

export default function GalleryDashboard() {
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const handleUploadComplete = () => {
    setRefreshKey(Date.now());
  };

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Gallery Images
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Upload and manage Happy Clients and legacy memorial gallery images.
          </p>
        </div>

        <GalleryUploader onUploadComplete={handleUploadComplete} />
        <GalleryList key={refreshKey} />
      </section>

      <section className="border-t border-gray-200 pt-8">
        <PendingMemorialList />
      </section>
    </div>
  );
}
