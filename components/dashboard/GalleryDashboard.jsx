// components/dashboard/GalleryDashboard.jsx
"use client";

import GalleryList from "@/components/dashboard/gallery/GalleryList";
import GalleryUploadForm from "@/components/dashboard/gallery/GalleryUploadForm";
import { useState } from "react";

export default function GalleryDashboard() {
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const handleUploadComplete = () => {
    setRefreshKey(Date.now()); // trigger GalleryList reload
  };

  return (
    <div className="space-y-6">
      <GalleryUploadForm onUploadComplete={handleUploadComplete} />
      <GalleryList key={refreshKey} />
    </div>
  );
}
