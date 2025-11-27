// components/cart/CartContext.jsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const CartCtx = createContext(null);
export function useCart() {
  return useContext(CartCtx);
}

export default function CartProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState({
    items: [],
    totals: { subtotalCents: 0, discountCents: 0, totalCents: 0 },
  });

  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/cart", { cache: "no-store" });
      setCart(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const add = async ({ productId, variantId, qty = 1 }) => {
    await fetch("/api/shop/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, qty }),
    });
    fetchCart();
    setOpen(true);
  };

  const updateQty = async (cartItemId, qty) => {
    await fetch("/api/shop/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId, qty }),
    });
    fetchCart();
  };

  const remove = async (cartItemId) => {
    await fetch("/api/shop/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId }),
    });
    fetchCart();
  };

  return (
    <CartCtx.Provider
      value={{ open, setOpen, cart, loading, add, updateQty, remove }}
    >
      {children}
    </CartCtx.Provider>
  );
}
