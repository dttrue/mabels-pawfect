// components/Donation.jsx

"use client";

import { useState } from "react";

const PRESET_AMOUNTS = [5, 10, 15];

export default function Donation({ className = "" }) {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    const finalAmount = selectedAmount || parseFloat(customAmount);
    if (!finalAmount || isNaN(finalAmount) || finalAmount < 1) {
      alert("Please select or enter a valid donation amount.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalAmount }),
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert("Something went wrong. Try again.");

    setLoading(false);
  };

  return (
    <div className={`text-center ${className}`}>
      <h2 className="text-lg font-semibold mb-2">Choose an amount:</h2>
      <div className="flex justify-center gap-3 mb-4">
        {PRESET_AMOUNTS.map((amt) => (
          <button
            key={amt}
            className={`px-4 py-2 rounded border ${
              selectedAmount === amt
                ? "bg-pink-600 text-white"
                : "bg-white text-gray-700 border-gray-300"
            }`}
            onClick={() => {
              setSelectedAmount(amt);
              setCustomAmount("");
            }}
          >
            ${amt}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <input
          type="number"
          min="1"
          placeholder="Custom amount"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setSelectedAmount(null);
          }}
          className="input input-bordered w-40"
        />
      </div>
      <button
        onClick={handleDonate}
        disabled={loading}
        className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
      >
        {loading
          ? "Redirecting..."
          : `Donate${
              selectedAmount || customAmount
                ? ` $${selectedAmount || customAmount}`
                : ""
            }`}
      </button>
      <p className="mt-2 text-xs text-gray-400">Secure payment via Stripe</p>
    </div>
  );
}
