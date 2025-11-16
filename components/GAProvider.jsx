// components/GAProvider.jsx

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackPageview } from "@/lib/ga";

export default function GAProvider({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    trackPageview(url);
  }, [pathname, searchParams]);

  return children;
}
