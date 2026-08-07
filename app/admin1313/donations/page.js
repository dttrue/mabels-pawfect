// app/admin1313/donations/page.js
import DonationManager from "@/components/dashboard/DonationManager";

export const metadata = {
  title: "Donation Management | Mabel’s Pawfect",
  description: "Review kitten rescue donations and payment activity.",
};

export default function AdminDonationsPage() {
  return <DonationManager />;
}
