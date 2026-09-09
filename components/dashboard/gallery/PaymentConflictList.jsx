"use client";

import { useEffect, useState } from "react";

function formatMoney(amountCents, currency) {
  if (!Number.isInteger(amountCents) || !currency) {
    return "Amount unavailable";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `${amountCents} ${String(currency).toUpperCase()}`;
  }
}

function formatEventTime(value) {
  if (!value) {
    return "Unknown event time";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatReason(reason) {
  return String(reason || "PAYMENT_REVIEW_REQUIRED")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

export default function PaymentConflictList() {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let canceled = false;

    async function loadConflicts() {
      try {
        const response = await fetch(
          "/api/admin/memorials/payment-conflicts",
          { cache: "no-store" }
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !Array.isArray(data?.conflicts)) {
          throw new Error(
            data?.error || "Memorial payment conflicts could not be loaded."
          );
        }

        if (!canceled) {
          setConflicts(data.conflicts);
        }
      } catch (loadError) {
        if (!canceled) {
          setError(
            loadError?.message ||
              "Memorial payment conflicts could not be loaded."
          );
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    loadConflicts();

    return () => {
      canceled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-gray-500">Checking payment conflicts...</p>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-5">
      <h2 className="text-xl font-semibold text-amber-950">
        Memorial payment conflicts
      </h2>
      <p className="mt-1 text-sm leading-6 text-amber-900/80">
        Money was received, but these memorials require manual payment review.
        No refund or automatic resolution has been performed.
      </p>

      <div className="mt-4 space-y-4">
        {conflicts.map((conflict) => (
          <article
            key={conflict.id}
            className="rounded-lg border border-amber-200 bg-white p-4 text-sm text-gray-800"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-gray-950">
                  {conflict.memorial?.petName || "Unknown memorial"}
                </p>
                <p className="break-all font-mono text-xs text-gray-600">
                  {conflict.memorial?.id || "No memorial ID"}
                </p>
              </div>
              <p className="font-semibold text-amber-900">
                {formatMoney(conflict.amountCents, conflict.currency)}
              </p>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Review reason
                </dt>
                <dd>{formatReason(conflict.reviewReason)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Event time
                </dt>
                <dd>{formatEventTime(conflict.eventTime)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Memorial state
                </dt>
                <dd>
                  {conflict.memorial?.status || "UNKNOWN"}
                  {conflict.memorial?.deletedAt ? " · deleted" : " · active"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Checkout attempt
                </dt>
                <dd>
                  {conflict.checkoutAttempt
                    ? `${
                        conflict.checkoutAttempt.stateAtPayment
                          ? `${conflict.checkoutAttempt.stateAtPayment} at payment · current ${conflict.checkoutAttempt.state}`
                          : conflict.checkoutAttempt.state
                      } · ${conflict.checkoutAttempt.id}`
                    : "Legacy or unlinked"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Stripe identities
                </dt>
                <dd className="break-all font-mono text-xs">
                  Event: {conflict.stripeEventId || "unavailable"}
                  <br />
                  Session: {conflict.stripeSessionId || "unavailable"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
