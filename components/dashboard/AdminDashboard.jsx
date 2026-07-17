// components/dashboard/AdminDashboard.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import NewsletterAdminForm from "@/components/dashboard/NewsletterAdminForm";
import ImagePreviewModal from "@/components/modals/ImagePreviewModal";
import OvernightBlocker from "@/components/dashboard/OvernightBlocker";
import GalleryDashboard from "@/components/dashboard/GalleryDashboard";
import ToggleSection from "@/components/common/ToggleSection";
import ProductAndImageUploader from "@/components/dashboard/ProductAndImageUploader";
import SiteImageUploader from "@/components/dashboard/SiteImageUploader";
import SiteImageList from "@/components/dashboard/SiteImageList";
import ContestUploader from "@/components/dashboard/ContestUploader";
import ContestList from "@/components/dashboard/ContestList";
import ShopImageList from "@/components/dashboard/ShopImageList";
import HighlightUploader from "@/components/dashboard/HighlightUploader";
import { HighlightsList } from "@/components/dashboard/HighlightsList";
import InventoryAdminPanel from "@/components/dashboard/InventoryAdminPanel";
import InventoryAdminPanelList from "@/components/dashboard/InventoryAdminPanelList";

export default function AdminDashboard() {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  // For images section
  const [productIdFilterInput, setProductIdFilterInput] = useState("");
  const [productIdFilter, setProductIdFilter] = useState(""); // applied filter
  const [imagesVersion, setImagesVersion] = useState(0); // bumps to refresh list

  function handleUploadComplete() {
    // bump the list key so ShopImageList reloads
    setImagesVersion((v) => v + 1);
  }



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

      <section className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-green-950">
              Bridget Employee Store
            </h2>

            <p className="mt-1 text-sm text-green-900/75">
              Shop available products with the automatic 50% employee discount
              and free shipping.
            </p>
          </div>

          <Link
            href="/admin1313/employee-store"
            className="btn btn-success whitespace-nowrap"
          >
            Open Employee Store
          </Link>
        </div>
      </section>

      {/* Newsletters */}
      <NewsletterAdminForm onSuccess={fetchNewsletters} />
      <div>
        <h2 className="text-xl font-semibold mb-4">📋 Current Newsletters</h2>
        {loading ? (
          <p>Loading...</p>
        ) : newsletters.length === 0 ? (
          <p className="text-gray-500">No newsletters yet.</p>
        ) : (
          <ToggleSection title="Manage Newsletters" defaultOpen={true}>
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
          </ToggleSection>
        )}
      </div>

      {previewImage && (
        <ImagePreviewModal
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Overnight blocking tool */}
      <OvernightBlocker />

      {/* Gallery Manager */}
      <div className="mt-16 border-t pt-12">
        <ToggleSection title="📸 Manage Gallery" defaultOpen={true}>
          <GalleryDashboard />
        </ToggleSection>
      </div>

      {/* 🧸 Product + Image Uploader */}
      <div className="mt-16 border-t pt-12">
        <ToggleSection title="🧸 Add New Products & Images" defaultOpen={false}>
          <ProductAndImageUploader onUploadComplete={handleUploadComplete} />
        </ToggleSection>
      </div>

      {/* 🖼️ Manage Shop Images */}
      <div className="mt-16 border-t pt-12">
        <ToggleSection title="🖼️ Manage Shop Images" defaultOpen={false}>
          <div>
            <div className="flex items-end gap-2 mb-3">
              <label className="form-control w-full">
                <span className="label-text">
                  Filter by Product ID (optional)
                </span>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Paste a productId to filter"
                  value={productIdFilterInput}
                  onChange={(e) => setProductIdFilterInput(e.target.value)}
                />
              </label>
              <button
                className="btn btn-outline"
                onClick={() => setProductIdFilter(productIdFilterInput.trim())}
              >
                Apply
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setProductIdFilterInput("");
                  setProductIdFilter("");
                }}
              >
                Clear
              </button>
            </div>

            <ShopImageList
              key={`shoplist-${imagesVersion}-${productIdFilter || "all"}`}
              productId={productIdFilter || undefined}
            />
          </div>
        </ToggleSection>
      </div>

      {/* Contest */}
      <ToggleSection title="🎃 Contest Uploads" defaultOpen={false}>
        <ContestUploader slug="halloween-2025" />
      </ToggleSection>

      <ToggleSection title="🎃 Contest Entries" defaultOpen={false}>
        <ContestList slug="halloween-2025" />
      </ToggleSection>

      <ToggleSection title="🎥 Upload Highlight" defaultOpen={true}>
        <HighlightUploader />
      </ToggleSection>

      <ToggleSection title="🎥 Current Highlights" defaultOpen={false}>
        <HighlightsList />
      </ToggleSection>

      {/* 📦 Inventory Admin */}
      <div className="mt-16 border-t pt-12">
        <ToggleSection
          title="📦 Inventory Admin (Full Panel)"
          defaultOpen={false}
        >
          <InventoryAdminPanel />
        </ToggleSection>

        <ToggleSection
          title="📋 Quick Adjust Inventory List"
          defaultOpen={false}
        >
          <InventoryAdminPanelList
            onReload={() => {
              /* optional toast */
            }}
          />
        </ToggleSection>

        {/* 
  ───────────────────────────────────────────────
  📌 SITE-WIDE IMAGE KEYS (Cloudinary-configurable)
  Update images across the whole website without code changes.
  Upload using <SiteImageUploader defaultKey="..." />

  🔥 HERO IMAGES
  - hero-main ...................... Homepage hero image

  🔥 LOGOS
  - logo-main ...................... Navbar + brand main logo

  🔥 ABOUT PAGE
  - about-main ..................... "Meet Bridget" photo on About page

  🔥 ANNOUNCEMENT BLOCK
  - announcement-main .............. Seasonal announcement postcard/banner

  🔥 PRICING + SPECIALS
  - pricing-flyer-main ............. Seasonal pricing flyer for:
                                      • /pricing-seasonal
                                      • ChristmasSpecials
                                      • Homepage Christmas blocks

  🔥 FUTURE-READY (not used yet, but ready)
  - postcard-main .................. General shareable flyer/postcard
  - seasonal-banner-main ........... Seasonal homepage banner
  - gallery-featured-main .......... Featured image on Gallery page
  - footer-logo-main ............... Footer logo if needed later

  To add ANY new graphic to the CMS layer:
  1. Pick a stable key (e.g., "newyears-flyer-main")
  2. Use <SiteImageUploader defaultKey="the-key-name" />
  3. Fetch it with /api/admin/site-images?key=the-key-name
  4. No redeploys, no hardcoded image paths needed
  ───────────────────────────────────────────────
*/}

        <ToggleSection title="🖼 Site Image Uploader" defaultOpen={false}>
          {/*
    SITE IMAGE KEYS (Cloudinary + SiteImage)
    ---------------------------------------
    hero-main ........ Homepage hero
    logo-main ........ Navbar logo
    about-main ....... Meet Bridget image
    badge-pet-cpr ...... Pet First Aid & CPR badge
    announcement-main  AnnouncementBlock image
    pricing-flyer-main Seasonal pricing flyer
  */}
          <SiteImageUploader defaultKey="logo-main" />

          <div className="mt-6">
            <SiteImageList />
          </div>
        </ToggleSection>
      </div>
    </div>
  );

}
