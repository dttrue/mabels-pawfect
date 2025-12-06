// components/dashboard/ProductAndImageUploader.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CATEGORIES, CATEGORY_PRESETS } from "@/scripts/products.data";

/** Combine product creation, editing, and image upload in one flow */
export default function ProductAndImageUploader() {
  const [mode, setMode] = useState("create"); // "create" | "edit" | "existing"

  const [chosenCats, setChosenCats] = useState(new Set());
  const [forDogs, setForDogs] = useState(true);
  const [forCats, setForCats] = useState(false);

  // product fields (create/edit)
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(""); // dollars string like "7.99"
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");

  // Weight & dimensions (imperial; metric derived)
  const [weightOz, setWeightOz] = useState("");
  const [lengthIn, setLengthIn] = useState("");
  const [widthIn, setWidthIn] = useState("");
  const [heightIn, setHeightIn] = useState("");

  // product lists / selection
  const [products, setProducts] = useState([]);
  const [existingProductId, setExistingProductId] = useState("");
  const [editProductId, setEditProductId] = useState("");

  // image fields
  const [imageFiles, setImageFiles] = useState([]);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [keywordsText, setKeywordsText] = useState(""); // UI as CSV

  const [loading, setLoading] = useState(false);

  const MAX_KEYWORDS = 10;
  const MAX_ALT_LENGTH = 125;

  // Fetch products for "existing" and "edit" modes
  useEffect(() => {
    if (mode !== "existing" && mode !== "edit") return;
    (async () => {
      try {
        const res = await fetch("/api/admin/shop/products?limit=200", {
          cache: "no-store",
        });
        const j = await res.json();
        setProducts(Array.isArray(j.products) ? j.products : []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load products");
      }
    })();
  }, [mode]);

  const filenameTitle = useMemo(
    () => (imageFiles[0]?.name ? humanize(imageFiles[0].name) : ""),
    [imageFiles]
  );

  function toggleCat(slug) {
    setChosenCats((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }
  function clearCats() {
    setChosenCats(new Set());
  }
  function setPreset(slugs) {
    setChosenCats(new Set(slugs));
  }

  function parseKeywords(input) {
    return String(input || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, MAX_KEYWORDS);
  }

  // Load a product into the form for editing
  async function loadProductToEdit(id) {
    setEditProductId(id);
    if (!id) return;

    try {
      const res = await fetch(`/api/admin/shop/products/${id}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to load product");

      const p = j.product || j;

      setTitle(p.title || "");
      setSubtitle(p.subtitle || "");
      setDescription(p.description || "");

      const priceStr =
        p.priceDollars != null
          ? Number(p.priceDollars).toFixed(2)
          : p.priceCents != null
            ? (p.priceCents / 100).toFixed(2)
            : "";
      setPrice(priceStr);

      setForDogs(!!p.forDogs);
      setForCats(!!p.forCats);

      // categorySlugs should be an array of slugs; fall back to [] if missing
      setChosenCats(new Set(p.categorySlugs || []));

      setWeightOz(
        p.weightOz != null && p.weightOz !== undefined ? String(p.weightOz) : ""
      );
      setLengthIn(
        p.lengthIn != null && p.lengthIn !== undefined ? String(p.lengthIn) : ""
      );
      setWidthIn(
        p.widthIn != null && p.widthIn !== undefined ? String(p.widthIn) : ""
      );
      setHeightIn(
        p.heightIn != null && p.heightIn !== undefined ? String(p.heightIn) : ""
      );
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to load product");
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      // 🔹 EDIT EXISTING PRODUCT (no image required)
      if (mode === "edit") {
        if (!editProductId) {
          toast.error("Pick a product to edit.");
          setLoading(false);
          return;
        }

        const weightOzNum = toNumberOrNull(weightOz);
        const lengthInNum = toNumberOrNull(lengthIn);
        const widthInNum = toNumberOrNull(widthIn);
        const heightInNum = toNumberOrNull(heightIn);

        const payload = {
          title,
          subtitle: subtitle || null,
          description: description || null,
          priceDollars: price || null,
          active: true,
          forDogs,
          forCats,
          weightOz: weightOzNum,
          weightGrams: weightOzNum != null ? ozToGrams(weightOzNum) : null,
          lengthIn: lengthInNum,
          lengthCm: lengthInNum != null ? inchesToCm(lengthInNum) : null,
          widthIn: widthInNum,
          widthCm: widthInNum != null ? inchesToCm(widthInNum) : null,
          heightIn: heightInNum,
          heightCm: heightInNum != null ? inchesToCm(heightInNum) : null,
          categorySlugs: Array.from(chosenCats),
        };

        const res = await fetch(`/api/admin/shop/products/${editProductId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || "Update failed");

        toast.success("✅ Product updated!");
        return; // do NOT run the image upload logic below
      }

      // 🔹 CREATE or ATTACH IMAGE PATHS (existing behavior)

      if (!imageFiles.length)
        return toast.error("At least one image is required.");
      if (!alt.trim())
        return toast.error("Alt text is required (accessibility).");
      if (alt.length > MAX_ALT_LENGTH)
        return toast.error(`Alt text must be ≤ ${MAX_ALT_LENGTH} characters.`);

      const kw = parseKeywords(keywordsText);

      // 1) Resolve productId (create or existing)
      let productId = existingProductId || null;

      if (mode === "create") {
        if (chosenCats.size === 0) {
          toast.error("Pick at least one category.");
          setLoading(false);
          return;
        }

        const weightOzNum = toNumberOrNull(weightOz);
        const lengthInNum = toNumberOrNull(lengthIn);
        const widthInNum = toNumberOrNull(widthIn);
        const heightInNum = toNumberOrNull(heightIn);

        const payload = {
          title,
          slug: slugify(title),
          priceDollars: price, // backend converts to cents
          subtitle: subtitle || undefined,
          description: description || undefined,
          categories: Array.from(chosenCats),
          active: true,
          forDogs,
          forCats,
          ...(weightOzNum != null && {
            weightOz: weightOzNum,
            weightGrams: ozToGrams(weightOzNum),
          }),
          ...(lengthInNum != null && {
            lengthIn: lengthInNum,
            lengthCm: inchesToCm(lengthInNum),
          }),
          ...(widthInNum != null && {
            widthIn: widthInNum,
            widthCm: inchesToCm(widthInNum),
          }),
          ...(heightInNum != null && {
            heightIn: heightInNum,
            heightCm: inchesToCm(heightInNum),
          }),
        };

        const createRes = await fetch("/api/admin/shop/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const createBody = await createRes.json();
        if (!createRes.ok)
          throw new Error(createBody?.error || "Create failed");
        productId = createBody?.product?.id;
        if (!productId) throw new Error("Product created but no id returned");
      } else {
        // mode === "existing"
        if (!existingProductId) {
          toast.error("Pick a product to attach the image.");
          setLoading(false);
          return;
        }
      }

      // 2) Upload ALL selected files to Cloudinary + DB
      const root = (
        process.env.NEXT_PUBLIC_CLOUDINARY_SHOP_ROOT || "pawfect/shop/products"
      ).replace(/\/+$/, "");

      const baseSlug = slugify(filenameTitle || title || "image") || "image";

      const stamp = Date.now(); // uniqueness

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];

        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_CLOUDINARY_SHOP_PRESET
        );

        const publicId = `${root}/${baseSlug}-${stamp}-${i}`;
        formData.append("folder", root);
        formData.append("public_id", publicId);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload`,
          { method: "POST", body: formData }
        );
        const cloud = await cloudRes.json();
        if (!cloudRes.ok || !cloud?.public_id || !cloud?.secure_url) {
          throw new Error(cloud?.error?.message || "Cloudinary upload failed");
        }

        const dbRes = await fetch("/api/admin/shop/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            imageUrl: cloud.secure_url,
            publicId: cloud.public_id,
            alt: alt.trim(),
            caption: caption.trim() || undefined,
            keywords: kw,
          }),
        });
        const db = await dbRes.json().catch(() => ({}));
        if (!dbRes.ok) throw new Error(db?.error || "DB insert failed");
      }

      toast.success(
        mode === "create"
          ? "🎉 Product created and images uploaded!"
          : "✅ Images uploaded to product!"
      );

      if (mode === "create") {
        setTitle("");
        setPrice("");
        setSubtitle("");
        setDescription("");
        setChosenCats(new Set());
        setWeightOz("");
        setLengthIn("");
        setWidthIn("");
        setHeightIn("");
        setForDogs(true);
        setForCats(false);
      }

      setImageFiles([]);
      setAlt("");
      setCaption("");
      setKeywordsText("");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 border rounded-lg bg-base-200 p-4">
      {/* Mode Switch */}
      <div className="flex items-center gap-4">
        <label className="label cursor-pointer">
          <span className="label-text mr-2">Mode:</span>
          <select
            className="select select-bordered select-sm"
            value={mode}
            onChange={(e) => {
              const next = e.target.value;
              setMode(next);
              if (next !== "edit") setEditProductId("");
            }}
          >
            <option value="create">Create New Product + Image</option>
            <option value="edit">Edit Existing Product</option>
            <option value="existing">Attach Image to Existing</option>
          </select>
        </label>
      </div>

      {/* Create & Edit Modes */}
      {mode === "create" || mode === "edit" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {mode === "edit" && (
            <div className="md:col-span-2">
              <label className="label">
                <span className="label-text font-semibold">
                  Select product to edit
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={editProductId}
                onChange={(e) => loadProductToEdit(e.target.value)}
              >
                <option value="">Choose a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — ${((p.priceCents || 0) / 100).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title & slug preview */}
          <div className="md:col-span-2">
            <label className="form-control">
              <span className="label-text">Product Title *</span>
              <input
                className="input input-bordered"
                placeholder="Product Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <p className="text-xs opacity-60 mt-1">
              URL preview: /shop/{slugify(title || "your-product")}
            </p>
          </div>

          {/* Price */}
          <label className="form-control">
            <span className="label-text">Price (USD) *</span>
            <div className="join">
              <div className="join-item input input-bordered flex items-center gap-1 w-40">
                <span className="opacity-60">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="7.99"
                />
              </div>

              {["6.00", "6.99", "7.99", "9.99", "12.99"].map((p) => (
                <button
                  key={p}
                  type="button"
                  className="join-item btn btn-ghost btn-xs"
                  onClick={() => setPrice(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-xs opacity-60 mt-1">
              {price ? `${centsFrom(price)}¢` : "0¢"}
            </p>
          </label>

          <input
            className="input input-bordered"
            placeholder="Subtitle (optional)"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />

          {/* Species selection */}
          <div className="md:col-span-2">
            <label className="label">
              <span className="label-text font-semibold">Species</span>
            </label>

            <div className="flex items-center gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="forDogs"
                  checked={!!forDogs}
                  onChange={(e) => setForDogs(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                🐶 For dogs
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="forCats"
                  checked={!!forCats}
                  onChange={(e) => setForCats(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                🐱 For cats
              </label>
            </div>
          </div>

          {/* Category Picker */}
          <div className="md:col-span-2">
            <label className="label">
              <span className="label-text font-semibold">Categories</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setPreset(CATEGORY_PRESETS.dogOnly)}
                >
                  Dog only
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setPreset(CATEGORY_PRESETS.catOnly)}
                >
                  Cat only
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setPreset(CATEGORY_PRESETS.dogPlush)}
                >
                  Dog + Plush
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={clearCats}
                >
                  Clear
                </button>
              </div>
            </label>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = chosenCats.has(c.slug);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggleCat(c.slug)}
                    className={`btn btn-xs ${
                      active ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            <p className="text-xs opacity-70 mt-2">
              Selected: {Array.from(chosenCats).join(", ") || "none"}
            </p>
          </div>

          {/* Description */}
          <textarea
            className="textarea textarea-bordered md:col-span-2"
            placeholder="Product Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
          <p className="text-sm text-gray-500 md:col-span-2">
            {description.length}/500 characters
          </p>

          {/* Weight & Dimensions */}
          <div className="md:col-span-2 border-t pt-3 mt-2 space-y-3">
            <h3 className="text-sm font-semibold">Weight & Dimensions</h3>
            <p className="text-xs opacity-70">
              Optional, but helps for shipping, SEO, and product details. Enter
              in ounces and inches; we’ll auto-calc grams and centimeters.
            </p>

            <div className="grid gap-3 sm:grid-cols-4">
              <label className="form-control">
                <span className="label-text text-xs">Weight (oz)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered input-sm"
                  value={weightOz}
                  onChange={(e) => setWeightOz(e.target.value)}
                  placeholder="e.g. 3.9"
                />
              </label>

              <label className="form-control">
                <span className="label-text text-xs">Length (in)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered input-sm"
                  value={lengthIn}
                  onChange={(e) => setLengthIn(e.target.value)}
                  placeholder="e.g. 5.1"
                />
              </label>

              <label className="form-control">
                <span className="label-text text-xs">Width (in)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered input-sm"
                  value={widthIn}
                  onChange={(e) => setWidthIn(e.target.value)}
                  placeholder="e.g. 5.1"
                />
              </label>

              <label className="form-control">
                <span className="label-text text-xs">Height (in)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered input-sm"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  placeholder="e.g. 4.3"
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        // Attach Image to Existing Mode
        <div className="grid gap-3">
          <select
            className="select select-bordered"
            value={existingProductId}
            onChange={(e) => setExistingProductId(e.target.value)}
          >
            <option value="">Select an existing product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} — ${((p.priceCents || 0) / 100).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Image + Meta (used for create + attach) */}
      {mode !== "edit" && (
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            className="file-input file-input-bordered"
          />
          <input
            className="input input-bordered"
            placeholder="Alt text (required)"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            maxLength={MAX_ALT_LENGTH}
          />
          <input
            className="input input-bordered"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <input
            className="input input-bordered md:col-span-2"
            placeholder="Keywords (comma list, max 10)"
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            onBlur={() =>
              setKeywordsText(parseKeywords(keywordsText).join(", "))
            }
          />
          <p className="text-xs opacity-70 md:col-span-2">
            {alt.length}/{MAX_ALT_LENGTH} alt chars •{" "}
            {parseKeywords(keywordsText).length}/{MAX_KEYWORDS} keywords
          </p>
        </div>
      )}

      <button
        className="btn btn-primary w-full"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? "Working…"
          : mode === "create"
            ? "Create Product + Upload Image"
            : mode === "edit"
              ? "Update Product"
              : "Attach Image to Product"}
      </button>
    </div>
  );
}

/* helpers */
function humanize(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function centsFrom(dollarsStr) {
  const n = Number(dollarsStr);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

// NEW helper fns
function toNumberOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function ozToGrams(oz) {
  return Number((oz * 28.3495).toFixed(2));
}
function inchesToCm(inches) {
  return Number((inches * 2.54).toFixed(2));
}
