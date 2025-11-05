// app/shop/page.js
// app/(site)/shop/page.jsx
import ShopGrid from "@/components/shop/ShopGrid";

export default async function ShopPage({ searchParams }) {
  const {
    c = "",        // category slugs, comma-separated (e.g. "dog,plush")
    q = "",        // text search
    stock = "",    // "1" = in-stock only
  } = searchParams ?? {};

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

