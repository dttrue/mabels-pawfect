// components/DonateSuccessClient.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function DonateSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const receiptRequested = useRef(false);

  const [status, setStatus] = useState("loading");
  const [amount, setAmount] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function verifyDonation() {
      if (!sessionId) {
        setStatus("invalid");
        return;
      }

      try {
        const response = await fetch("/api/get-donation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || "Unable to verify this donation.");
        }

        setAmount(data?.amount ?? null);
        setStatus("success");

        if (!receiptRequested.current) {
          receiptRequested.current = true;

          fetch("/api/email/send-donation-receipt", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          }).catch((error) => {
            console.error("[donation receipt] request failed:", error);
          });
        }
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("[donation] verification failed:", error);
        setStatus("error");
      }
    }

    verifyDonation();

    return () => {
      controller.abort();
    };
  }, [sessionId]);

  const formattedAmount = formatCurrency(amount);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-white px-4 py-16">
        <section
          className="w-full max-w-xl rounded-2xl border border-pink-200 bg-white p-8 text-center shadow-sm"
          aria-live="polite"
        >
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Confirming Your Donation
          </h1>

          <p className="mt-3 text-gray-600">
            Please wait while we verify your payment with Stripe.
          </p>
        </section>
      </main>
    );
  }

  if (status === "invalid" || status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-white px-4 py-16">
        <section className="w-full max-w-xl rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            Kitten Rescue Fund
          </p>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            We Could Not Confirm Your Donation
          </h1>

          <p className="mt-4 text-gray-700">
            We could not verify a completed Stripe payment from this page.
          </p>

          <p className="mt-3 text-sm text-gray-500">
            If you received a payment confirmation from Stripe, please contact
            us before trying again so you are not charged twice.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/donations"
              className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
            >
              Return to Donations
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-white px-4 py-16">
      <section className="w-full max-w-xl rounded-2xl border border-pink-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-pink-600">
          Kitten Rescue Fund
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
          Thank You for Your Donation
        </h1>

        <p className="mt-4 text-lg text-gray-700">
          {formattedAmount
            ? `Your donation of ${formattedAmount} was successful.`
            : "Your donation was successful."}
        </p>

        <p className="mt-3 leading-7 text-gray-600">
          Your support helps provide food, litter, formula, medical care, and a
          safe temporary home for rescued kittens.
        </p>

        <p className="mt-4 text-sm text-gray-500">
          A confirmation receipt will be sent to the email address used during
          checkout.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
          >
            Return Home
          </Link>

          <Link
            href="/donations"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Make Another Donation
          </Link>
        </div>
      </section>
    </main>
  );
}
