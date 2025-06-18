// app/admin/page.js

import NewsletterDashboard from "@/components/dashboard/AdminDashboard";
import GalleryDashboard from "@/components/dashboard/GalleryDashboard";
import PruneButton from "@/components/dashboard/gallery/PruneButton";

export default function AdminNewsletterPage() {
  return (
    <>
      <NewsletterDashboard />
      <GalleryDashboard />
      <PruneButton />
    </>
  );
}
