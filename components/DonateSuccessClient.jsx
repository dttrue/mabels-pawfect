// components/DonateSuccessClient.jsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function DonateSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [amount, setAmount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDonation() {
      console.log("📦 sessionId from URL:", sessionId);
      if (!sessionId) return;

      try {
        const res = await fetch("/api/get-donation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();
        console.log("💰 Donation data response:", data);
        setAmount(data.amount);
      } catch (err) {
        console.error("❌ Failed to fetch donation amount:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDonation();
  }, [sessionId]);

console.log("✅ Rendered with amount:", amount);

useEffect(() => {
  if (!sessionId) return;

  // fire-and-forget; no need to block the UI
  fetch("/api/email/send-donation-receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  }).catch(() => {});
}, [sessionId]);


  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white shadow-md p-6 rounded-lg max-w-xl text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-2">
          🎉 Thank You for Your Donation!
        </h1>
        <p className="text-lg text-gray-700 mb-4">
          {loading
            ? "Processing your donation..."
            : amount
              ? `Your donation of $${amount} was successful. Your support helps us rescue, feed, and care for stray animals in need.`
              : `Your support helps us rescue, feed, and care for stray animals in need.`}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          A confirmation email will be sent to you shortly. We truly appreciate
          your kindness 💗
        </p>
        <Link href="/">
          <button className="mt-6 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
