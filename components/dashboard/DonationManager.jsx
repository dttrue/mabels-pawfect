// components/dashboard/DonationManager.jsx
"use client";

import { useCallback, useEffect, useState } from "react";

const STATUS_LABELS = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const TARGET_LABELS = {
  GENERAL: "General Rescue Fund",
  FOSTER_CAT: "Foster Cat",
};

const PURPOSE_LABELS = {
  GENERAL: "Custom Donation",
  FOOD_LITTER: "Food and Litter",
  TOYS_ENRICHMENT: "Toys and Enrichment",
  KITTEN_RESCUE: "General Rescue Care",
  PREMIUM_RESCUE: "Medical and Emergency Support",
};

const STATUS_STYLES = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  PAID: "border-green-200 bg-green-50 text-green-800",
  FAILED: "border-red-200 bg-red-50 text-red-800",
  REFUNDED: "border-gray-300 bg-gray-100 text-gray-700",
};

function formatCurrency(cents, currency = "usd") {
  const value = Number.isFinite(Number(cents)) ? Number(cents) : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
  }).format(value / 100);
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function shortenStripeId(value) {
  if (!value) return "Not available";
  if (value.length <= 28) return value;

  return `${value.slice(0, 16)}...${value.slice(-8)}`;
}

function SummaryCard({ label, value, secondary }) {
  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>

      {secondary ? (
        <p className="mt-1 text-xs text-gray-500">{secondary}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] || "border-gray-200 bg-gray-50 text-gray-700"
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function getDonationItems(donation) {
  if (Array.isArray(donation?.items) && donation.items.length > 0) {
    return donation.items;
  }

  // Older donations only have the parent purpose and total amount.
  return [
    {
      id: `legacy-${donation.id}`,
      purpose: donation.purpose,
      amountCents: donation.amountCents,
      quantity: 1,
    },
  ];
}

function DonationPurposeList({ donation }) {
  const items = getDonationItems(donation);

  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const quantity = Number.isInteger(item.quantity) ? item.quantity : 1;
        const lineTotalCents = Number(item.amountCents || 0) * quantity;

        return (
          <li
            key={item.id || `${item.purpose}-${index}`}
            className="flex items-start justify-between gap-3"
          >
            <span className="text-gray-700">
              {PURPOSE_LABELS[item.purpose] || item.purpose}
              {quantity > 1 ? ` Ã— ${quantity}` : ""}
            </span>

            <span className="shrink-0 font-semibold text-gray-900">
              {formatCurrency(lineTotalCents, donation.currency)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function DonationManager() {
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState({
    allDonationCount: 0,
    paidDonationCount: 0,
    paidAmountCents: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
  });

  const [fosterCats, setFosterCats] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [target, setTarget] = useState("");
  const [purpose, setPurpose] = useState("");
  const [fosterCatId, setFosterCatId] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedDonationIds, setExpandedDonationIds] = useState(
    () => new Set()
  );

  const loadDonations = useCallback(
    async ({ showRefreshState = false } = {}) => {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "25",
        });

        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (target) params.set("target", target);
        if (purpose) params.set("purpose", purpose);
        if (fosterCatId) params.set("fosterCatId", fosterCatId);

        const response = await fetch(
          `/api/admin/donations?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load donation records.");
        }

        setDonations(Array.isArray(data.donations) ? data.donations : []);
        setSummary((current) => ({
          ...current,
          ...(data.summary || {}),
        }));
        setFosterCats(Array.isArray(data.fosterCats) ? data.fosterCats : []);
        setPagination((current) => ({
          ...current,
          ...(data.pagination || {}),
        }));
      } catch (loadError) {
        console.error("[DonationManager] load error:", loadError);
        setError(loadError?.message || "Failed to load donation records.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status, target, purpose, fosterCatId]
  );

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setTarget("");
    setPurpose("");
    setFosterCatId("");
    setPage(1);
  }

  function toggleDonationDetails(donationId) {
    setExpandedDonationIds((current) => {
      const next = new Set(current);

      if (next.has(donationId)) {
        next.delete(donationId);
      } else {
        next.add(donationId);
      }

      return next;
    });
  }

  const hasFilters = search || status || target || purpose || fosterCatId;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fffaf3] to-pink-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-700">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Donation Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Review payment activity, donation purposes, and the foster cats
              receiving support.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadDonations({
                showRefreshState: true,
              })
            }
            disabled={refreshing}
            className="rounded-lg border border-pink-300 bg-white px-4 py-2.5 text-sm font-semibold text-pink-700 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh Donations"}
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="Total Received"
            value={formatCurrency(summary.paidAmountCents)}
            secondary={`${summary.paidDonationCount} paid donations`}
          />

          <SummaryCard label="All Records" value={summary.allDonationCount} />

          <SummaryCard label="Paid" value={summary.paidDonationCount} />

          <SummaryCard label="Pending" value={summary.pendingCount} />

          <SummaryCard label="Failed" value={summary.failedCount} />

          <SummaryCard label="Refunded" value={summary.refundedCount} />
        </section>

        <section className="mt-8 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Search and Filter
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Search donors, foster cats, or Stripe transaction IDs.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="grid gap-4 lg:grid-cols-[minmax(220px,1.5fr),repeat(4,minmax(150px,1fr)),auto]"
          >
            <div>
              <label
                htmlFor="donation-search"
                className="mb-1 block text-xs font-semibold text-gray-600"
              >
                Search
              </label>

              <input
                id="donation-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name, email, cat, or Stripe ID"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            <div>
              <label
                htmlFor="donation-status"
                className="mb-1 block text-xs font-semibold text-gray-600"
              >
                Status
              </label>

              <select
                id="donation-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              >
                <option value="">All statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="donation-target"
                className="mb-1 block text-xs font-semibold text-gray-600"
              >
                Destination
              </label>

              <select
                id="donation-target"
                value={target}
                onChange={(event) => {
                  setTarget(event.target.value);
                  setPage(1);

                  if (event.target.value !== "FOSTER_CAT") {
                    setFosterCatId("");
                  }
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              >
                <option value="">All destinations</option>
                <option value="GENERAL">General Rescue Fund</option>
                <option value="FOSTER_CAT">Foster Cat</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="donation-purpose"
                className="mb-1 block text-xs font-semibold text-gray-600"
              >
                Purpose
              </label>

              <select
                id="donation-purpose"
                value={purpose}
                onChange={(event) => {
                  setPurpose(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              >
                <option value="">All purposes</option>
                <option value="GENERAL">Custom Donation</option>
                <option value="FOOD_LITTER">Food and Litter</option>
                <option value="TOYS_ENRICHMENT">Toys and Enrichment</option>
                <option value="KITTEN_RESCUE">General Rescue Care</option>
                <option value="PREMIUM_RESCUE">
                  Medical and Emergency Support
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="donation-foster-cat"
                className="mb-1 block text-xs font-semibold text-gray-600"
              >
                Foster Cat
              </label>

              <select
                id="donation-foster-cat"
                value={fosterCatId}
                onChange={(event) => {
                  setFosterCatId(event.target.value);
                  setPage(1);

                  if (event.target.value) {
                    setTarget("FOSTER_CAT");
                  }
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              >
                <option value="">All foster cats</option>

                {fosterCats.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700"
              >
                Search
              </button>
            </div>
          </form>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-pink-700 hover:text-pink-900"
            >
              Clear all filters
            </button>
          ) : null}
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Donation Records
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {pagination.totalItems} matching records
              </p>
            </div>
          </div>

          {error ? (
            <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading donation records...
            </div>
          ) : donations.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="font-semibold text-gray-800">
                No donation records found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Completed and pending Stripe checkouts will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-6 py-3">Donor</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Destination</th>
                      <th className="px-6 py-3">Ways They Are Helping</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Stripe Reference</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {donations.map((donation) => (
                      <tr key={donation.id} className="align-top">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            {donation.donorName || "Not provided"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {donation.donorEmail || "No email"}
                          </p>

                          {donation.donorPhone ? (
                            <p className="mt-1 text-xs text-gray-500">
                              {donation.donorPhone}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-6 py-4 font-bold text-gray-900">
                          {formatCurrency(
                            donation.amountCents,
                            donation.currency
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {donation.target === "FOSTER_CAT"
                            ? donation.fosterCat?.name || "Removed foster cat"
                            : TARGET_LABELS[donation.target] || donation.target}
                        </td>

                        <td className="min-w-[240px] px-6 py-4 text-sm">
                          <DonationPurposeList donation={donation} />
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={donation.status} />
                        </td>

                        <td className="px-6 py-4 text-xs text-gray-600">
                          {formatDate(donation.paidAt || donation.createdAt)}
                        </td>

                        <td className="px-6 py-4">
                          <p
                            className="max-w-[220px] break-all font-mono text-xs text-gray-600"
                            title={donation.stripeSessionId}
                          >
                            {shortenStripeId(donation.stripeSessionId)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-100 lg:hidden">
                {donations.map((donation) => {
                  const isExpanded = expandedDonationIds.has(donation.id);
                  const detailsId = `donation-details-${donation.id}`;

                  return (
                    <article key={donation.id} className="p-4">
                      <button
                        type="button"
                        onClick={() => toggleDonationDetails(donation.id)}
                        aria-expanded={isExpanded}
                        aria-controls={detailsId}
                        className="w-full rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                      >
                        <span className="flex items-start justify-between gap-4">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-gray-900">
                              {donation.donorName || "Donor name not provided"}
                            </span>

                            <span className="mt-1 block truncate text-xs text-gray-500">
                              {donation.donorEmail || "No email provided"}
                            </span>
                          </span>

                          <span className="shrink-0 text-right">
                            <span className="block text-lg font-bold text-gray-900">
                              {formatCurrency(
                                donation.amountCents,
                                donation.currency
                              )}
                            </span>

                            <span className="mt-1 block text-xs font-semibold text-pink-700">
                              {isExpanded ? "Hide details" : "View details"}
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`ml-1 inline-block h-3.5 w-3.5 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              >
                                <path d="m5 7.5 5 5 5-5" />
                              </svg>
                            </span>
                          </span>
                        </span>

                        <span className="mt-3 flex items-center justify-between gap-3">
                          <StatusBadge status={donation.status} />

                          <span className="text-xs text-gray-500">
                            {formatDate(donation.paidAt || donation.createdAt)}
                          </span>
                        </span>
                      </button>

                      {isExpanded ? (
                        <div
                          id={detailsId}
                          className="mt-4 border-t border-gray-100 pt-4"
                        >
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold uppercase text-gray-400">
                                Destination
                              </p>

                              <p className="mt-1 text-gray-700">
                                {donation.target === "FOSTER_CAT"
                                  ? donation.fosterCat?.name ||
                                    "Removed foster cat"
                                  : TARGET_LABELS[donation.target] ||
                                    donation.target}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase text-gray-400">
                                Ways They Are Helping
                              </p>

                              <div className="mt-1 text-sm">
                                <DonationPurposeList donation={donation} />
                              </div>
                            </div>
                          </div>

                          {donation.donorPhone ? (
                            <div className="mt-4">
                              <p className="text-xs font-semibold uppercase text-gray-400">
                                Phone
                              </p>

                              <p className="mt-1 text-sm text-gray-700">
                                {donation.donorPhone}
                              </p>
                            </div>
                          ) : null}

                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase text-gray-400">
                              Stripe Reference
                            </p>

                            <p
                              className="mt-1 break-all font-mono text-[11px] text-gray-500"
                              title={donation.stripeSessionId}
                            >
                              {donation.stripeSessionId || "Not available"}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {!loading && pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!pagination.hasPreviousPage}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1)
                  )
                }
                disabled={!pagination.hasNextPage}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
