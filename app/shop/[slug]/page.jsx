// app/shop/[slug]/page.jsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { centsToUSD } from "@/lib/money";
import ProductImage from "@/components/shop/ProductImage";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  // ✅ New: await params
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sort: "asc" } },
      categories: { select: { name: true, slug: true } },
    },
  });

  if (!product) return notFound();

  const img = product.images?.[0];

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div>
          {img ? (
            <ProductImage
              publicId={img.publicId}
              alt={img.alt || product.title}
            />
          ) : (
            <div className="bg-base-200 w-full aspect-square rounded-2xl flex items-center justify-center">
              <span className="opacity-60 text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          {product.subtitle && (
            <p className="text-base-content/70 mb-4">{product.subtitle}</p>
          )}

          <p className="text-xl font-semibold mb-4">
            {centsToUSD(product.priceCents)}
          </p>

          {product.description && <p className="mb-6">{product.description}</p>}

          <div className="flex flex-wrap gap-2 mb-6">
            {product.categories.map((c) => (
              <span key={c.slug} className="badge badge-outline">
                {c.name}
              </span>
            ))}
          </div>

          <a href="/shop" className="btn btn-outline">
            ← Back to Shop
          </a>
        </div>
      </div>
    </main>
  );
}
