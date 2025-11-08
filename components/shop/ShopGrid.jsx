// components/shop/ShopGrid.jsx
import prisma from "@/lib/prisma";
import { centsToUSD } from "@/lib/money";
import ProductCard from "@/components/shop/ProductCard";
import ShopFilterBar from "@/components/shop/ShopFilterBar";

export const dynamic = "force-dynamic";

export default async function ShopGrid({
  title = "Shop",
  showBackLink = true,
  selectedCategories = [],
  query = "",
  inStockOnly = false,
}) {
  // Data for chips
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  // Build Prisma WHERE
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
      variants: { select: { id: true, name: true, priceCents: true } },
      inventory: { select: { variantId: true, onHand: true } }, // tiny payload
    },
    take: 24,
  });
  const items = products.map((p) => ({
    ...p,
    _price: centsToUSD(p.priceCents),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-3 sm:px-4 pb-20 pt-6 md:pt-8">
      {/* Header */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {title}
        </h1>
        {showBackLink && (
          <a
            href="/"
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-base-200"
          >
            ← Home
          </a>
        )}
      </div>

      {/* Sticky filter bar (adjust top to your nav height as needed) */}
      <div className="sticky top-16 z-30 -mx-3 sm:-mx-4 bg-base-100/85 backdrop-blur supports-[backdrop-filter]:bg-base-100/70 border-y sm:border rounded-none sm:rounded-xl sm:border">
        <div className="px-3 sm:px-4 py-3 sm:py-3.5">
          <ShopFilterBar
            categories={categories}
            selected={selectedCategories}
            query={query}
            inStockOnly={inStockOnly}
          />
          <div className="mt-2 flex items-center justify-between text-xs sm:text-sm text-base-content/70">
            <span>
              {items.length} result{items.length === 1 ? "" : "s"}
              {query ? <> • “{query}”</> : null}
            </span>
            {selectedCategories.length || query || inStockOnly ? (
              <a
                href="/shop"
                className="underline underline-offset-2 hover:text-base-content"
              >
                Clear all
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Responsive grid with auto-fit columns */}
      <div
        className="mt-4 sm:mt-6 grid gap-4 sm:gap-5"
        style={{
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(45%, 180px), 1fr))",
        }}
      >
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}

        {items.length === 0 && (
          <div className="col-span-full text-center text-sm opacity-70 py-10">
            No products match your filters.
          </div>
        )}
      </div>

      {/* Safe-area spacer for mobile FABs */}
      <div
        className="h-6 sm:h-8"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      />
    </main>
  );
}
