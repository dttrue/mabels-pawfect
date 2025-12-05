// app/shop/[slug]/page.jsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { centsToUSD } from "@/lib/money";
import ProductSizeGuide from "@/components/shop/ProductSizeGuide";
import ProductImageGallery from "@/components/shop/ProductImageGallery"; // 👈 NEW

export const dynamic = "force-dynamic";

export default async function ProductPage(props) {
  const { params } = await props;
  const { slug } = (await params) || {};

  if (typeof slug !== "string") {
    return notFound();
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        where: { deletedAt: null }, // ignore soft-deleted
        orderBy: { sort: "asc" },
      },
      categories: { select: { name: true, slug: true } },
    },
  });

  if (!product) return notFound();

  const hasWeight = typeof product.weightOz === "number";
  const hasDims =
    typeof product.lengthIn === "number" &&
    typeof product.widthIn === "number" &&
    typeof product.heightIn === "number";

  const weightLine = hasWeight
    ? `Weight: ${product.weightOz.toFixed(1)} oz${
        typeof product.weightGrams === "number"
          ? ` (${product.weightGrams.toFixed(2)} g)`
          : ""
      }`
    : null;

  const dimLine = hasDims
    ? `Dimensions: ${product.lengthIn.toFixed(1)} x ${product.widthIn.toFixed(
        1
      )} x ${product.heightIn.toFixed(1)} in${
        typeof product.lengthCm === "number" &&
        typeof product.widthCm === "number" &&
        typeof product.heightCm === "number"
          ? ` (${product.lengthCm.toFixed(1)} x ${product.widthCm.toFixed(
              1
            )} x ${product.heightCm.toFixed(1)} cm)`
          : ""
      }`
    : null;

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <ProductImageGallery
            images={product.images}
            productTitle={product.title}
          />
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

          {product.description && (
            <p className="mb-6 whitespace-pre-line">{product.description}</p>
          )}

          {/* Size guide */}
          <ProductSizeGuide product={product} />

          {/* Optional: show weight/dims lines under size guide */}
          {weightLine && (
            <p className="text-sm text-base-content/70 mt-2">{weightLine}</p>
          )}
          {dimLine && <p className="text-sm text-base-content/70">{dimLine}</p>}

          <div className="flex flex-wrap gap-2 mb-6 mt-4">
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
