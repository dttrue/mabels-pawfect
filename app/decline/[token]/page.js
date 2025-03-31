import DeclineBooking from "@/components/DeclineBooking";

// app/decline/[token]/page.js
export default function DeclineBookingPage({ params }) {
  const { token } = params;
  return <DeclineBooking token={token} />;
}

