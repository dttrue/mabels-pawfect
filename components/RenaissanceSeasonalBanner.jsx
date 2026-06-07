// components/RenaissanceSeasonalBanner.jsx
"use client";

import SeasonalBanner from "@/components/SeasonalBanner";

export default function RenaissanceSeasonalBanner(props) {
  return (
    <SeasonalBanner
      title="Renaissance Season at Mabel’s"
      subtitle="Royal care for loyal companions — see our current pet care pricing."
      link="/pricing-seasonal"
      ctaText="See Pricing"
      id="renaissance-seasonal-banner"
      leftIcon="⚜️"
      rightIcon="👑"
      bg="bg-[#f4ead8]"
      fg="text-[#3a281a]"
      accent="bg-[#8b5e34]"
      pattern=""
      showAccent={true}
      analyticsPage="homepage"
      analyticsLocation="renaissance_seasonal_banner"
      {...props}
    />
  );
}
