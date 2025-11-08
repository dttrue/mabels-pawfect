// app/shop/page.js
import ShopGrid from "@/components/shop/ShopGrid";

export default async function ShopPage({ searchParams }) {
  const c = (searchParams?.c ?? "").trim(); // e.g. "dog,interactive,chew,bundle-set"
  const q = (searchParams?.q ?? "").trim();
  const stock = (searchParams?.stock ?? "").trim(); // "1" when checked

  // decode + split
  const selected = c
    ? c
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const inStockOnly = stock === "1";

  return (
    <ShopGrid
      title="Shop"
      showBackLink
      selectedCategories={selected} // slugs only
      query={q}
      inStockOnly={inStockOnly}
    />
  );
}
