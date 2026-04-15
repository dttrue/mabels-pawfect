// components/seasonal-pricing/Pricing.jsx
"use client";

import useSWR from "swr";
import PricingShell from "./PricingShell";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Pricing({
  imageKey = "pricing-flyer-main",
  bookingHref = "/booking",
}) {
  const { data } = useSWR(
    `/api/admin/site-images?key=${encodeURIComponent(imageKey)}`,
    fetcher
  );

  return <PricingShell image={data?.image} bookingHref={bookingHref} />;
}
