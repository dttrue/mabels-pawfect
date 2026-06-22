// components/home/ShopCTA.jsx
"use client";

import { trackShopNavClick } from "@/lib/ga-events";

export default function ShopCTA({ summerSaleActive = false }) {
  function handleClick() {
    trackShopNavClick({
      page: summerSaleActive
        ? "homepage_summer_sale_shop_section"
        : "homepage_shop_section",
    });
  }

  return (
    <section
      className={[
        "py-16 px-6 text-center rounded-2xl shadow-md mt-12 overflow-hidden relative",
        summerSaleActive
          ? "bg-gradient-to-r from-amber-100 via-orange-100 to-pink-100 border border-amber-200"
          : "bg-gradient-to-r from-pink-200 via-rose-100 to-yellow-100",
      ].join(" ")}
    >
      {summerSaleActive && (
        <div className="mb-4 inline-flex rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-tight text-amber-950 shadow-sm">
          ☀️ Summer Toy Clearout
        </div>
      )}

      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        {summerSaleActive
          ? "Select Pet Toys Are Marked Down!"
          : "🛍️ Treat Your Pets to Something Pawfect!"}
      </h2>

      {summerSaleActive ? (
        <>
          <p className="max-w-2xl mx-auto text-gray-700 mb-5">
            We’re making room for new inventory, so select plush, snuffle,
            puzzle, and nosework toys are now on sale while supplies last.
          </p>

          <div className="mb-8 flex flex-wrap justify-center gap-2 text-xs font-medium text-gray-700">
            <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
              $12.99 toys now $10.99
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
              $14.99 toys now $12.99
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
              $22 toys now $17.99
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
              Limited stock
            </span>
          </div>
        </>
      ) : (
        <p className="max-w-2xl mx-auto text-gray-600 mb-8">
          Our brand-new{" "}
          <span className="font-semibold text-pink-600">Toy Shop</span> is open!
          Browse hand-picked toys and treats your furry friends will love — from
          plush favorites to durable chew toys. Every purchase supports our
          small pet-sitting business ❤️
        </p>
      )}

      <a
        href="/shop"
        onClick={handleClick}
        className={[
          "btn btn-wide text-lg",
          summerSaleActive
            ? "bg-pink-400 border-pink-400 text-white hover:bg-pink-500 hover:border-pink-500"
            : "btn-primary",
        ].join(" ")}
      >
        {summerSaleActive ? "Shop the Summer Sale →" : "🐶 Visit the Shop"}
      </a>

      {summerSaleActive && (
        <p className="mt-3 text-xs text-gray-500">
          Sale prices are shown in the shop with the original price crossed out.
        </p>
      )}
    </section>
  );
}
