// app/admin1313/employee-store/page.js
import Link from "next/link";
import ShopGrid from "@/components/shop/ShopGrid";

export default async function EmployeeStorePage({ searchParams }) {
  const params = (await searchParams) ?? {};

  const categories = (params.c ?? "").trim();
  const query = (params.q ?? "").trim();
  const stock = (params.stock ?? "").trim();

  const selectedCategories = categories
    ? categories.split(",").filter(Boolean)
    : [];

  const inStockOnly = stock === "1";

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-3 pt-8 sm:px-4">
        <div className="rounded-xl border bg-base-100 p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm text-base-content/60">Admin tools</p>

              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Bridget Employee Store
              </h1>

              <p className="mt-2 text-sm text-base-content/70">
                Employee purchases receive 50% off and free shipping
                automatically during checkout.
              </p>
            </div>

            <Link href="/admin1313" className="btn btn-outline btn-sm">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <ShopGrid
        title="Employee Products"
        showBackLink={false}
        selectedCategories={selectedCategories}
        query={query}
        inStockOnly={inStockOnly}
      />
    </>
  );
}
