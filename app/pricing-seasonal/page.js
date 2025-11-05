// app/pricing-seasonal/page.js  (or wherever you render the seasonal flyer)

import Pricing from "@/components/seasonal-pricing/Pricing";

export const metadata = {
  title: "Pricing | Mabel’s Pawfect",
  description: "Thanksgiving seasonal pricing & specials.",
};

export default function PricingSeasonalPage() {
  return (
    <Pricing
      src="/images/seasonal-pricing/fall-thanksgiving-pricing-2025.jpg" // ✅ exact path+file in /public
      validity="Valid Nov 1 – Nov 30" // ✅ update copy
      ooo="" // ✅ no OOO in Nov
      showHeader={true}
    />
  );
}
