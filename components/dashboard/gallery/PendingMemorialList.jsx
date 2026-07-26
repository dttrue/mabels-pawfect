// components/dashboard/gallery/PendingMemorialList.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

function formatMoney(amountCents, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((amountCents || 0) / 100);
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusClasses(status) {
  switch (status) {
    case "PAID":
      return "bg-amber-100 text-amber-800";
    case "PUBLISHED":
      return "bg-emerald-100 text-emerald-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function PendingMemorialList() {
  const [memorials, setMemorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("PAID");
  const [selectedMemorial, setSelectedMemorial] = useState(null);

  useEffect(() => {
    async function loadMemorials() {
      try {
        const response = await fetch("/api/admin/memorials", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load memorials.");
        }

        setMemorials(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("[ADMIN_MEMORIALS_FETCH_ERROR]", error);
        toast.error("Failed to load memorial submissions.");
      } finally {
        setLoading(false);
      }
    }

    loadMemorials();
  }, []);

  const filteredMemorials = useMemo(() => {
    if (selectedStatus === "ALL") {
      return memorials;
    }

    return memorials.filter((memorial) => memorial.status === selectedStatus);
  }, [memorials, selectedStatus]);

  if (loading) {
    return (
      <p className="text-sm text-gray-500">Loading memorial submissions...</p>
    );
  }

  const handleDelete = async (memorialId) => {
    const confirmed = window.confirm(
      "Delete this memorial? It can be restored for 15 minutes."
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/memorials/${memorialId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Delete failed.");
      }

      const deletedAt =
        data?.memorial?.deletedAt ||
        data?.deletedAt ||
        new Date().toISOString();

      setMemorials((current) =>
        current.map((memorial) =>
          memorial.id === memorialId
            ? {
                ...memorial,
                deletedAt,
              }
            : memorial
        )
      );

      setSelectedMemorial(null);
      toast.success("Memorial deleted. Undo is available for 15 minutes.");
    } catch (error) {
      console.error("[ADMIN_MEMORIAL_DELETE_ERROR]", error);
      toast.error(error.message || "Failed to delete memorial.");
    }
  };

  const handlePublish = async (memorialId) => {
    const confirmed = window.confirm(
      "Publish this memorial to the public memorial gallery?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/admin/memorials/${memorialId}/publish`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Publish failed.");
      }

      setMemorials((current) =>
        current.map((memorial) =>
          memorial.id === memorialId
            ? {
                ...memorial,
                ...data.memorial,
              }
            : memorial
        )
      );

      setSelectedMemorial(null);

      toast.success("Memorial published.");
    } catch (error) {
      console.error("[ADMIN_MEMORIAL_PUBLISH_ERROR]", error);
      toast.error(error.message || "Failed to publish memorial.");
    }
  };

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Memorial Submissions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review paid memorials before publishing them.
          </p>
        </div>

        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="select select-sm select-bordered"
        >
          <option value="PAID">Awaiting Review</option>
          <option value="PUBLISHED">Published</option>
          <option value="REJECTED">Rejected</option>
          <option value="ALL">All Memorials</option>
        </select>
      </div>

      {filteredMemorials.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm text-gray-500">
            No memorial submissions match this filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredMemorials.map((memorial) => {
            const coverImage =
              memorial.images.find((image) => image.isCover) ||
              memorial.images[0];

            return (
              <article
                key={memorial.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="grid sm:grid-cols-[180px_1fr]">
                  <div className="relative min-h-48 bg-gray-100">
                    {coverImage ? (
                      <Image
                        src={coverImage.imageUrl}
                        alt={
                          coverImage.altText || `${memorial.petName} memorial`
                        }
                        fill
                        className="object-cover"
                        sizes="180px"
                      />
                    ) : (
                      <div className="flex h-full min-h-48 items-center justify-center px-4 text-center text-sm text-gray-400">
                        No image available
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {memorial.petName}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Submitted by {memorial.ownerName}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                          memorial.status
                        )}`}
                      >
                        {memorial.status}
                      </span>
                    </div>

                    {memorial.headline && (
                      <p className="mt-4 line-clamp-2 text-sm italic text-gray-700">
                        {memorial.headline}
                      </p>
                    )}

                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-gray-400">Contribution</dt>
                        <dd className="font-medium text-gray-800">
                          {formatMoney(
                            memorial.donationAmountCents,
                            memorial.currency
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-gray-400">Submitted</dt>
                        <dd className="font-medium text-gray-800">
                          {formatDate(memorial.createdAt)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-gray-400">Photos</dt>
                        <dd className="font-medium text-gray-800">
                          {memorial.images.length}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-gray-400">Paid</dt>
                        <dd className="font-medium text-gray-800">
                          {formatDate(memorial.paidAt)}
                        </dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      onClick={() => setSelectedMemorial(memorial)}
                      className="mt-5 inline-flex rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-700"
                    >
                      Review Memorial
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedMemorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedMemorial.petName}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Submitted by {selectedMemorial.ownerName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMemorial(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {selectedMemorial.images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100"
                >
                  <Image
                    src={image.imageUrl}
                    alt={
                      image.altText || `${selectedMemorial.petName} memorial`
                    }
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 300px"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-5">
              {selectedMemorial.headline && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Headline
                  </h3>
                  <p className="mt-1 text-gray-800">
                    {selectedMemorial.headline}
                  </p>
                </div>
              )}

              {selectedMemorial.story && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Story
                  </h3>
                  <p className="mt-1 whitespace-pre-line leading-7 text-gray-700">
                    {selectedMemorial.story}
                  </p>
                </div>
              )}

              {selectedMemorial.favoriteThings && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Favorite Things
                  </h3>
                  <p className="mt-1 whitespace-pre-line text-gray-700">
                    {selectedMemorial.favoriteThings}
                  </p>
                </div>
              )}

              {selectedMemorial.closingMessage && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Closing Message
                  </h3>
                  <p className="mt-1 whitespace-pre-line italic text-gray-700">
                    {selectedMemorial.closingMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Review this submission before publishing or deleting it.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedMemorial.id)}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                >
                  Delete Memorial
                </button>

                <button
                  type="button"
                  onClick={() => handlePublish(selectedMemorial.id)}
                  className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-700"
                >
                  Publish Memorial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
