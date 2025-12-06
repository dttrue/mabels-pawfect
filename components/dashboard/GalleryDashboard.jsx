// components/dashboard/GalleryDashboard.jsx
"use client";

import { useState } from "react";
import GalleryList from "@/components/dashboard/gallery/GalleryList";
import GalleryUploader from "@/components/dashboard/GalleryUploader";

export default function GalleryDashboard() {
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const handleUploadComplete = () => {
    setRefreshKey(Date.now()); // trigger GalleryList reload
  };

  return (
    <div className="space-y-6">
      <GalleryUploader onUploadComplete={handleUploadComplete} />
      <GalleryList key={refreshKey} />
    </div>
  );
}
