// components/shop/ShopGrid.jsx
import prisma from "@/lib/prisma";
import { centsToUSD } from "@/lib/money";
import ProductCard from "@/components/shop/ProductCard";
import ShopFilterBar from "@/components/shop/ShopFilterBar";

export const dynamic = "force-dynamic";

export default async function ShopGrid({
  title = "Shop",
  showBackLink = true,
  selectedCategories = [], // array of slugs: ["dog","plush"]
  query = "", // text search
  inStockOnly = false, // boolean
}) {
  // Pull all categories once so the filter bar is data-driven
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  // Build WHERE from filters
  const where = {
    active: true,
    deletedAt: null,
    ...(selectedCategories.length
      ? { categories: { some: { slug: { in: selectedCategories } } } }
      : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { subtitle: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(inStockOnly ? { inventory: { some: { onHand: { gt: 0 } } } } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    include: {
      images: {
        orderBy: { sort: "asc" },
        select: {
          id: true,
          publicId: true,
          url: true,
          alt: true,
          caption: true,
        },
      },
    },
    take: 24,
  });

  const items = products.map((p) => ({
    ...p,
    _price: centsToUSD(p.priceCents),
  }));

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        {showBackLink && (
          <a href="/" className="link">
            Back to home
          </a>
        )}
      </div>

      <ShopFilterBar
        categories={categories}
        selected={selectedCategories}
        query={query}
        inStockOnly={inStockOnly}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center text-sm opacity-60">
            No products match your filters.
          </div>
        )}
      </div>
    </main>
  );
}
