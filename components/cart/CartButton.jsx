// components/cart/CartButton.jsx
"use client";
import { useCart } from "./CartContext";

export default function CartButton() {
  const { cart, setOpen } = useCart();
  const count = cart.items?.reduce((s, i) => s + i.qty, 0) || 0;

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open cart"
      className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full shadow-lg bg-pink-300 text-white flex items-center justify-center"
    >
      <span className="text-xl">🛒</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-semibold rounded-full h-6 min-w-6 px-1 grid place-items-center">
          {count}
        </span>
      )}
    </button>
  );
}
