// components/dashboard/ProductAndImageUploader.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CATEGORIES, CATEGORY_PRESETS } from "@/scripts/products.data";

/** Combine product creation and image upload in one flow */
export default function ProductAndImageUploader() {
  const [mode, setMode] = useState("create"); // "create" | "existing"
  const [chosenCats, setChosenCats] = useState(new Set(["dog", "plush"]));
  // product fields (create)
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(""); // dollars string like "7.99"
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState(""); // product-only
  const [categories, setCategories] = useState("dog, plush");

  // existing product selection
  const [products, setProducts] = useState([]);
  const [existingProductId, setExistingProductId] = useState("");

  // image fields
  const [imageFile, setImageFile] = useState(null);
  const [alt, setAlt] = useState(""); // ← schema field
  const [caption, setCaption] = useState("");
  const [keywordsText, setKeywordsText] = useState(""); // UI as CSV

  const [loading, setLoading] = useState(false);

  const MAX_KEYWORDS = 10;
  const MAX_ALT_LENGTH = 125;

  // Fetch products for the "existing" mode
  useEffect(() => {
    if (mode !== "existing") return;
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
    () => (imageFile?.name ? humanize(imageFile.name) : ""),
    [imageFile]
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

  async function handleSubmit() {
    if (!imageFile) return toast.error("Image is required.");
    if (!alt.trim())
      return toast.error("Alt text is required (accessibility).");
    if (alt.length > MAX_ALT_LENGTH)
      return toast.error(`Alt text must be ≤ ${MAX_ALT_LENGTH} characters.`);

    const kw = parseKeywords(keywordsText);

    setLoading(true);
    try {
      // 1) Resolve productId (create or existing)
      let productId = existingProductId || null;

      if (mode === "create") {
        if (!title || !price) {
          toast.error("Title and price are required.");
          setLoading(false);
          return;
        }
        const createRes = await fetch("/api/admin/shop/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug: slugify(title),
            priceDollars: price, // backend converts to cents
            subtitle: subtitle || undefined,
            description: description || undefined, // product desc
            categories: categoriesToArray(categories),
            active: true,
          }),
        });
        const createBody = await createRes.json();
        if (!createRes.ok)
          throw new Error(createBody?.error || "Create failed");
        productId = createBody?.product?.id;
        if (!productId) throw new Error("Product created but no id returned");
      } else {
        if (!existingProductId) {
          toast.error("Pick a product to attach the image.");
          setLoading(false);
          return;
        }
      }

      // 2) Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_SHOP_PRESET
      );

      const root = (
        process.env.NEXT_PUBLIC_CLOUDINARY_SHOP_ROOT || "pawfect/shop/products"
      ).replace(/\/+$/, "");
      const publicId = `${root}/${slugify(filenameTitle || title || "image")}`;
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

      // 3) Persist ProductImage (note: no product description here)
      const dbRes = await fetch("/api/admin/shop/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          imageUrl: cloud.secure_url,
          publicId: cloud.public_id,
          alt: alt.trim(), // ← schema
          caption: caption.trim() || undefined,
          keywords: kw, // ← array<string>
        }),
      });
      const db = await dbRes.json().catch(() => ({}));
      if (!dbRes.ok) throw new Error(db?.error || "DB insert failed");

      toast.success(
        mode === "create"
          ? "🎉 Product created and image uploaded!"
          : "✅ Image uploaded to product!"
      );

      // reset minimal fields (don’t wipe products list)
      if (mode === "create") {
        setTitle("");
        setPrice("");
        setSubtitle("");
        setDescription("");
        setCategories("dog, plush");
      }
      setImageFile(null);
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
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="create">Create New Product + Image</option>
            <option value="existing">Attach Image to Existing</option>
          </select>
        </label>
      </div>

      {/* Create Mode */}
      {mode === "create" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="input input-bordered"
            placeholder="Product Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="text-xs opacity-60 mt-1">
            URL preview: /shop/{slugify(title || "your-product")}
          </p>
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
        </div>
      ) : (
        // Existing Mode
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

      {/* Image + Meta */}
      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
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
          onBlur={() => setKeywordsText(parseKeywords(keywordsText).join(", "))}
        />
        <p className="text-xs opacity-70 md:col-span-2">
          {alt.length}/{MAX_ALT_LENGTH} alt chars •{" "}
          {parseKeywords(keywordsText).length}/{MAX_KEYWORDS} keywords
        </p>
      </div>

      <button
        className="btn btn-primary w-full"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? "Working…"
          : mode === "create"
            ? "Create Product + Upload Image"
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
function categoriesToArray(s) {
  return s
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function centsFrom(dollarsStr) {
  const n = Number(dollarsStr);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

