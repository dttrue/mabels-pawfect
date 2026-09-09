// components/Analytics.jsx
"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GA_ID, trackPageview } from "@/lib/ga";

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fire a page_view on first load + every route change
  useEffect(() => {
    if (!GA_ID) return;

    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;

    // This uses your lib/ga.js helper
    trackPageview(url);
  }, [pathname, searchParams]);

  // No GA ID → no scripts or tracking
  if (!GA_ID) return null;

  return (
    <>
      {/* Load GA4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      {/* Init GA4, but don't auto-send page_view */}
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
