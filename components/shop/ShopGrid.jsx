// components/shop/ShopGrid.jsx
import  prisma  from "@/lib/prisma";
import { centsToUSD } from "@/lib/money";
import ProductCard from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic"; // ensures live data without rebuild

export default async function ShopGrid({
  title = "Shop",
  showBackLink = true,
}) {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    include: {
     images: {
       orderBy: { sort: "asc" },
       select: {
         id: true,
         publicId: true, // <-- needed for <CldImage src={publicId}>
         url: true,      // <-- fallback for legacy rows
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
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {showBackLink && (
          <a href="/" className="link">
            Back to home
          </a>
        )}
      </div>

      {/* Filters (MVP placeholder) */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="badge">All</span>
        <span className="badge badge-outline">Toys</span>
        <span className="badge badge-outline">Chew Toys</span>
        <span className="badge badge-outline">Cats</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}
