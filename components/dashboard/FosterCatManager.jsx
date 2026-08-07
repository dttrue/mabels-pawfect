// components/dashboard/FosterCatManager.jsx
"use client";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const INITIAL_FORM = {
  name: "",
  slug: "",
  shortBio: "",
  story: "",
  careNeeds: "",
  ageLabel: "",
  sex: "",
  imageAlt: "",
  goalDollars: "",
  status: "ACTIVE",
  sortOrder: "0",
  isFeatured: true,
};

function formatCurrency(cents) {
  if (!Number.isInteger(cents)) {
    return "No goal";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function FosterCatManager() {
  const { getToken } = useAuth();  
  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState(null);
  const [cats, setCats] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const previewUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadCats() {
    setLoadingCats(true);

    try {
      const token = await getToken();

      const response = await fetch("/api/admin/foster-cats", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load foster cats.");
      }

      setCats(Array.isArray(data?.cats) ? data.cats : []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "Unable to load foster cats.",
      });
    } finally {
      setLoadingCats(false);
    }
  }

  useEffect(() => {
    loadCats();
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    if (!file) {
      setMessage({
        type: "error",
        text: "Select an image for this foster cat.",
      });
      return;
    }

    const goalDollars =
      form.goalDollars.trim() === "" ? null : Number(form.goalDollars);

    if (
      goalDollars !== null &&
      (!Number.isFinite(goalDollars) || goalDollars < 0)
    ) {
      setMessage({
        type: "error",
        text: "Enter a valid fundraising goal.",
      });
      return;
    }

    const payload = new FormData();

    payload.append("file", file);
    payload.append("name", form.name);
    payload.append("slug", form.slug);
    payload.append("shortBio", form.shortBio);
    payload.append("story", form.story);
    payload.append("careNeeds", form.careNeeds);
    payload.append("ageLabel", form.ageLabel);
    payload.append("sex", form.sex);
    payload.append("imageAlt", form.imageAlt);
    payload.append("status", form.status);
    payload.append("sortOrder", form.sortOrder);
    payload.append("isFeatured", String(form.isFeatured));

    if (goalDollars !== null) {
      payload.append("goalCents", String(Math.round(goalDollars * 100)));
    }

    try {
      setSubmitting(true);

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Your admin session is unavailable. Please sign in again."
        );
      }

      const response = await fetch("/api/admin/foster-cats", {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Unable to add foster cat.");
      }

      setForm(INITIAL_FORM);
      setFile(null);
      setMessage({
        type: "success",
        text: `${data.cat.name} was added successfully.`,
      });

      await loadCats();
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "Unable to add foster cat.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(cat) {
    const confirmed = window.confirm(
      `Remove ${cat.name} from the foster cat system? The record and Cloudinary image will be preserved for recovery.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(cat.id);
      setMessage(null);

      const token = await getToken();

      const response = await fetch(
        `/api/admin/foster-cats/${encodeURIComponent(cat.id)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Unable to remove foster cat.");
      }

      setCats((current) =>
        current.filter((existingCat) => existingCat.id !== cat.id)
      );

      setMessage({
        type: "success",
        text: data?.message || `${cat.name} was removed.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "Unable to remove foster cat.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/admin1313"
          className="text-sm font-medium text-pink-700 hover:underline"
        >
          Back to Admin Dashboard
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Foster Cat Donations
        </h1>

        <p className="mt-2 max-w-2xl text-gray-600">
          Add the foster cats currently receiving care and control which cats
          donors can support.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg border p-4 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px),1fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Foster Cat
          </h2>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Cat name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={updateField}
                className="input input-bordered w-full"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Custom URL slug
              </span>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={updateField}
                className="input input-bordered w-full"
                placeholder="Generated from the name if left blank"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Short bio</span>
              <textarea
                name="shortBio"
                value={form.shortBio}
                onChange={updateField}
                className="textarea textarea-bordered min-h-24 w-full"
                maxLength={240}
                required
              />
              <span className="mt-1 block text-xs text-gray-500">
                {form.shortBio.length}/240 characters
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Full story</span>
              <textarea
                name="story"
                value={form.story}
                onChange={updateField}
                className="textarea textarea-bordered min-h-32 w-full"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Current care needs
              </span>
              <textarea
                name="careNeeds"
                value={form.careNeeds}
                onChange={updateField}
                className="textarea textarea-bordered min-h-24 w-full"
                placeholder="Food, veterinary care, medication, supplies..."
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Age</span>
                <input
                  type="text"
                  name="ageLabel"
                  value={form.ageLabel}
                  onChange={updateField}
                  className="input input-bordered w-full"
                  placeholder="About 8 weeks"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Sex</span>
                <select
                  name="sex"
                  value={form.sex}
                  onChange={updateField}
                  className="select select-bordered w-full"
                >
                  <option value="">Not specified</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Fundraising goal
              </span>
              <input
                type="number"
                name="goalDollars"
                value={form.goalDollars}
                onChange={updateField}
                min="0"
                step="0.01"
                className="input input-bordered w-full"
                placeholder="500.00"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Image</span>
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                }}
                required
              />
            </label>

            {previewUrl && (
              <img
                src={previewUrl}
                alt="Selected foster cat preview"
                className="aspect-square w-full rounded-lg border object-cover"
              />
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Image alt text
              </span>
              <input
                type="text"
                name="imageAlt"
                value={form.imageAlt}
                onChange={updateField}
                className="input input-bordered w-full"
                maxLength={125}
                placeholder="Describe the cat and visible setting"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Status</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={updateField}
                  className="select select-bordered w-full"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="FUNDED">Funded</option>
                  <option value="ADOPTED">Adopted</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Display order
                </span>
                <input
                  type="number"
                  name="sortOrder"
                  value={form.sortOrder}
                  onChange={updateField}
                  className="input input-bordered w-full"
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={updateField}
                className="checkbox checkbox-primary"
              />
              <span className="text-sm font-medium">Show on donation page</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="btn w-full border-pink-600 bg-pink-600 text-white hover:border-pink-700 hover:bg-pink-700"
            >
              {submitting ? "Uploading and saving..." : "Add Foster Cat"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Current Foster Cats
            </h2>

            <button
              type="button"
              onClick={loadCats}
              disabled={loadingCats}
              className="btn btn-sm btn-outline"
            >
              Refresh
            </button>
          </div>

          {loadingCats ? (
            <p className="text-gray-500">Loading foster cats...</p>
          ) : cats.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
              No foster cats have been added yet.
            </div>
          ) : (
            <div className="grid items-start gap-5 sm:grid-cols-2">
              {cats.map((cat) => (
                <details
                  key={cat.id}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-3 transition hover:bg-pink-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 [&::-webkit-details-marker]:hidden">
                    <img
                      src={cat.imageUrl}
                      alt=""
                      aria-hidden="true"
                      className="h-20 w-20 shrink-0 rounded-lg border border-gray-100 object-cover"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span>
                          <span className="block truncate font-bold text-gray-900">
                            {cat.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-gray-500">
                            /{cat.slug}
                          </span>
                        </span>

                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">
                          {formatStatus(cat.status)}
                        </span>
                      </span>

                      <span className="mt-2 flex items-center justify-between gap-3 text-xs">
                        <span className="text-gray-500">
                          Goal:
                          <span className="ml-1 font-semibold text-gray-800">
                            {formatCurrency(cat.goalCents)}
                          </span>
                        </span>

                        <span className="font-semibold text-pink-700">
                          <span className="group-open:hidden">Expand</span>
                          <span className="hidden group-open:inline">
                            Collapse
                          </span>
                        </span>
                      </span>
                    </span>
                  </summary>

                  <div className="border-t border-gray-100">
                    <img
                      src={cat.imageUrl}
                      alt={cat.imageAlt || cat.name}
                      className="aspect-square w-full object-cover"
                    />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-gray-500">/{cat.slug}</p>
                        </div>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          {formatStatus(cat.status)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {cat.shortBio}
                      </p>

                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-gray-500">Raised</dt>
                          <dd className="font-semibold text-gray-900">
                            {formatCurrency(cat.raisedCents)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-500">Goal</dt>
                          <dd className="font-semibold text-gray-900">
                            {formatCurrency(cat.goalCents)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-500">Donations</dt>
                          <dd className="font-semibold text-gray-900">
                            {cat.paidDonationCount}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-gray-500">Public</dt>
                          <dd className="font-semibold text-gray-900">
                            {cat.isFeatured ? "Visible" : "Hidden"}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-5 border-t border-gray-100 pt-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          disabled={deletingId === cat.id}
                          className="btn btn-sm btn-outline btn-error w-full"
                        >
                          {deletingId === cat.id
                            ? "Removing..."
                            : "Remove Foster Cat"}
                        </button>
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
