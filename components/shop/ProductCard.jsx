// components/shop/ProductCard.jsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useCart } from "@/components/cart/CartContext";
import { CldImage } from "next-cloudinary";
import { trackEvent, trackAddToCart } from "@/lib/ga-events";

// Simple name→swatch mapping. Extend as needed.
const SWATCH = {
  pink: "bg-pink-400",
  purple: "bg-purple-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  blue: "bg-blue-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  turquoise: "bg-teal-400",

  // 🌀 Multi-color
  mixed: "bg-gradient-to-r from-pink-400 via-yellow-400 to-blue-400",

  // 🍦 Dessert-style
  chocolate: "bg-amber-800",
  vanilla: "bg-amber-100",
  mint: "bg-emerald-300",
  strawberry: "bg-rose-300",

  // 🎨 Unique
  other: "bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-lime-400",

  // ⚙️ Fallback
  default: "bg-gray-400",

  // 🍕 Pizza
  supreme: "bg-gradient-to-r from-amber-400 via-green-500 to-red-500",
  pepperoni: "bg-gradient-to-r from-red-500 via-amber-300 to-rose-500",
  pepperoniBlackOlive:
    "bg-gradient-to-r from-red-600 via-gray-600 to-amber-400",

  // 🧶 NEW clean slugs
  redWhite: "bg-gradient-to-r from-red-500 via-red-100 to-white",
  black: "bg-gray-900",
};

function swatchClass(name = "") {
  const key = name.trim().toLowerCase();
  return SWATCH[key] || SWATCH.default;
}

export default function ProductCard({ product }) {
  const { add } = useCart();
  const img = product.images?.[0];

  // variants merged in ShopGrid
  const variants = product._variants ?? [];
  const hasVariants = variants.length > 0;

  // injected from ShopGrid
  const gridIndex = product._index ?? null;
  const isLowStock = product._lowStock ?? null;

  const [selectedId, setSelectedId] = useState(null);

  // If there is exactly one in-stock variant, preselect it
  useEffect(() => {
    if (variants.length === 1 && (variants[0]?.onHand ?? 0) > 0) {
      setSelectedId(variants[0].id);
    }
  }, [variants]);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedId) || null,
    [variants, selectedId]
  );

  const singleInStock =
    variants.length === 1 && (variants[0]?.onHand ?? 0) > 0
      ? variants[0]
      : null;

  const canAdd = !hasVariants || !!selectedVariant || !!singleInStock;

  // 🔹 GA: product card impression (fires on mount)
  useEffect(() => {
    trackEvent("product_card_impression", {
      product_id: product.id,
      product_slug: product.slug,
      category: product.category || null,
      is_low_stock: isLowStock,
      has_variants: hasVariants,
      grid_index: gridIndex,
      location: "shop_grid",
    });
  }, [
    product.id,
    product.slug,
    product.category,
    hasVariants,
    gridIndex,
    isLowStock,
  ]);

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();

    // Prefer the chosen variant; otherwise fallback to the only in-stock one
    const v = selectedVariant || singleInStock || null;

    const priceNumber =
      typeof product.priceCents === "number"
        ? product.priceCents / 100
        : undefined;

    // 🔹 GA: add_to_cart
    trackAddToCart({
      productId: product.id,
      title: product.title,
      price: priceNumber,
      variant: v?.name || null,
      category: product.category || null,
      inventoryRemaining: typeof v?.onHand === "number" ? v.onHand : null,
      isLowStock,
      gridIndex,
      location: "shop_grid",
    });

    add({
      productId: product.id,
      qty: 1,
      ...(v ? { variantId: v.id } : {}),
    });
  }

  function handlePickVariant(e, id, disabled) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    setSelectedId(id);

    const variant = variants.find((v) => v.id === id);

    // 🔹 GA: variant_select
    trackEvent("variant_select", {
      product_id: product.id,
      product_slug: product.slug,
      variant_id: id,
      variant_name: variant?.name || null,
      stock_remaining:
        typeof variant?.onHand === "number" ? variant.onHand : null,
      grid_index: gridIndex,
      location: "shop_grid",
    });
  }

  function handleCardClick() {
    // 🔹 GA: product_card_click
    trackEvent("product_card_click", {
      product_id: product.id,
      product_slug: product.slug,
      category: product.category || null,
      is_low_stock: isLowStock,
      has_variants: hasVariants,
      grid_index: gridIndex,
      location: "shop_grid",
    });
  }

  return (
    <a
      href={`/shop/${product.slug}`}
      onClick={handleCardClick}
      className="relative card bg-white border hover:shadow-lg transition"
    >
      <figure className="aspect-square overflow-hidden">
        {img ? (
          img.publicId ? (
            <CldImage
              src={img.publicId}
              width={600}
              height={600}
              crop="fill"
              gravity="auto"
              alt={img.alt ?? product.title}
              sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
            />
          ) : (
            <img
              src={img.url}
              alt={img.alt ?? product.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full grid place-items-center text-sm opacity-60">
            No image
          </div>
        )}
      </figure>

      <div className="card-body p-3">
        <h3 className="font-semibold leading-tight line-clamp-2">
          {product.title}
        </h3>
        {product.subtitle ? (
          <p className="text-xs opacity-70 line-clamp-1">{product.subtitle}</p>
        ) : null}
        <div className="mt-2 font-medium">{product._price}</div>

        {/* Variant swatches */}
        {hasVariants && (
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => {
              const out = v.onHand <= 0;
              const selected = selectedId === v.id;
              return (
                <button
                  key={v.id}
                  onClick={(e) => handlePickVariant(e, v.id, out)}
                  className={[
                    "relative h-7 w-7 rounded-full border",
                    swatchClass(v.name),
                    selected ? "ring-2 ring-offset-2 ring-base-300" : "",
                    out ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                  title={`${v.name}${out ? " (Sold out)" : ""}`}
                  aria-label={`${v.name}${out ? " (Sold out)" : ""}`}
                >
                  {out && (
                    <span
                      className="pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-black/60"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add-to-cart pill */}
      <button
        onClick={handleAdd}
        disabled={!canAdd}
        className={[
          "absolute bottom-3 right-3 rounded-full text-white text-sm px-3 py-1.5 shadow-md active:scale-95",
          canAdd ? "bg-orange-500" : "bg-gray-300 cursor-not-allowed",
        ].join(" ")}
        aria-label={
          hasVariants && !selectedVariant ? "Select a color" : "Add to cart"
        }
      >
        {hasVariants && !selectedVariant ? "Select" : "Add"}
      </button>
    </a>
  );
}
