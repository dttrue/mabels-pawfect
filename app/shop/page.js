// app/shop/page.js
import ShopGrid from "@/components/shop/ShopGrid";

export default function ShopPage({ searchParams }) {
  const params = searchParams ?? {};

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
