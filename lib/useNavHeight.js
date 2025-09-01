// lib/useNavHeight.js
"use client"; 
import { useEffect, useState } from "react";

export default function useNavHeight(navId = "site-nav") {
  const [h, setH] = useState(64);
  useEffect(() => {
    const el = document.getElementById(navId);
    if (!el) return;
    const update = () => setH(el.offsetHeight || 64);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [navId]);
  return h;
}
