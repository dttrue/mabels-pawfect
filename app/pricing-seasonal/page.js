// app/pricing/page.js
import Pricing from "@/components/seasonal-pricing/Pricing";

export const metadata = {
  title: "Pricing | Mabel’s Pawfect",
  description: "Fall pricing & specials — Bridget’s flyer.",
};

export default function PricingPage() {
  return (
    <Pricing
      src="/images/pricing/fall-2025.jpg"
      validity="Valid Sept 22 – Oct 26"
      ooo="Out of Office Oct 27–31 • Book early!"
      showHeader={true}
    />
  );
}
