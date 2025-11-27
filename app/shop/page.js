// app/shop/page.js
import ShopGrid from "@/components/shop/ShopGrid";

export default async function ShopPage({ searchParams }) {
  // Next 15: searchParams is async-like, so await it once
  const params = (await searchParams) ?? {};

  const c = (params.c ?? "").trim(); // e.g. "dog,interactive,chew,bundle-set"
  const q = (params.q ?? "").trim();
  const stock = (params.stock ?? "").trim(); // "1" when checked

  const selected = c ? c.split(",").filter(Boolean) : [];
  const inStockOnly = stock === "1";

  return (
    <ShopGrid
      title="Shop"
      showBackLink
      selectedCategories={selected}
      query={q}
      inStockOnly={inStockOnly}
    />
  );
}
