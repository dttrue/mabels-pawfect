// components/home/ShopCTA.jsx
export default function ShopCTA() {
  return (
    <section className="bg-gradient-to-r from-pink-200 via-rose-100 to-yellow-100 py-16 px-6 text-center rounded-2xl shadow-md mt-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        🛍️ Treat Your Pets to Something Pawfect!
      </h2>
      <p className="max-w-2xl mx-auto text-gray-600 mb-8">
        Our brand-new <span className="font-semibold text-pink-600">Toy Shop</span> is open!
        Browse hand-picked toys and treats your furry friends will love —
        from plush favorites to durable chew toys. Every purchase supports
        our small pet-sitting business ❤️
      </p>
      <a href="/shop" className="btn btn-primary btn-wide text-lg">
        🐶 Visit the Shop
      </a>
    </section>
  );
}
