// components/shop/ProductCard.jsx
"use client";
import { useCart } from "@/components/cart/CartContext";
import { CldImage } from "next-cloudinary";
export default function ProductCard({ product }) {
  const { add } = useCart();
  const img = product.images?.[0];

  function handleAdd(e) {
    // don't follow the link when tapping the Add button
    e.preventDefault();
    e.stopPropagation();
    add({ productId: product.id, qty: 1 });
  }

  return (
    <a
      href={`/shop/${product.slug}`}
      className="relative card bg-white border hover:shadow-lg transition"
    >
      <figure className="aspect-square overflow-hidden">
       {img ? (
         img.publicId ? (
           <CldImage
             src={img.publicId}           // ✅ prefer Cloudinary publicId
             width={600}
             height={600}
             crop="fill"
             gravity="auto"
             alt={img.alt ?? product.title}
             // nice-to-haves:
             sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
             priority={false}
           />
         ) : (
           // Fallback for legacy rows that only have a URL
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
      </div>

      {/* Add-to-cart pill — positioned over the card, tap-safe on mobile */}
      <button
        onClick={handleAdd}
        className="absolute bottom-3 right-3 rounded-full bg-orange-500 text-white text-sm px-3 py-1.5 shadow-md active:scale-95"
        aria-label="Add to cart"
      >
        Add
      </button>
    </a>
  );
}
