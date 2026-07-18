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

    if (!finalAmount || Number.isNaN(finalAmount) || finalAmount < 1) {
      alert("Please select or enter a valid donation amount.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: finalAmount,
          donationType: "kitten-rescue",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.url) {
        throw new Error(
          data?.error || "Something went wrong. Please try again."
        );
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("[donation] checkout error:", error);

      alert(error?.message || "Something went wrong. Please try again.");

      setLoading(false);
    }
  };

  const displayedAmount = selectedAmount || customAmount;

  return (
    <div className={`text-center ${className}`}>
      <section className="mb-8 overflow-hidden rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-100 text-left shadow-sm">
        <img
          src="/images/kitten-rescue.jpeg"
          alt="Rescued kittens receiving care"
          className="w-full rounded-t-xl bg-white object-contain"
        />

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-700">
            Kitten Rescue Fund
          </p>

          <h2 className="mt-2 text-xl font-bold text-gray-900">
            Help Save Rescue Kittens
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-700">
            Your donation provides food, litter, formula, medical care, and a
            safe place for rescued kittens until they find loving homes.
          </p>
        </div>
      </section>

      <h2 className="mb-2 text-lg font-semibold">Choose an amount:</h2>

      <div className="mb-4 flex justify-center gap-3">
        {PRESET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            className={`rounded border px-4 py-2 transition ${
              selectedAmount === amount
                ? "border-pink-600 bg-pink-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-pink-400"
            }`}
            onClick={() => {
              setSelectedAmount(amount);
              setCustomAmount("");
            }}
          >
            ${amount}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="number"
          min="1"
          step="1"
          inputMode="decimal"
          placeholder="Custom amount"
          value={customAmount}
          onChange={(event) => {
            setCustomAmount(event.target.value);
            setSelectedAmount(null);
          }}
          className="input input-bordered w-40"
        />
      </div>

      <button
        type="button"
        onClick={handleDonate}
        disabled={loading}
        className="rounded-lg bg-pink-600 px-6 py-3 text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Redirecting..."
          : `Donate${displayedAmount ? ` $${displayedAmount}` : ""}`}
      </button>

      <p className="mt-2 text-xs text-gray-400">Secure payment via Stripe</p>
    </div>
  );
}
