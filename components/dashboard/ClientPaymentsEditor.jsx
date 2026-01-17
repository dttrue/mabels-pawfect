// components/dashboard/ClientPaymentsEditor.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApiFetch } from "@/lib/adminApiClient";
import { useAdminMutation } from "@/hooks/useAdminMutation";

const METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "stripe", label: "Card / Stripe" },
  { value: "other", label: "Other" },
];

function money(cents = 0) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n / 100);
}

export default function ClientPaymentsEditor({ appointments = [] }) {
  const router = useRouter();
  const { saving, err, setErr, run } = useAdminMutation();

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [targetApptId, setTargetApptId] = useState("");
  const [editingPayment, setEditingPayment] = useState(null);

  const [form, setForm] = useState({
    amountDollars: "",
    method: "cash",
    notes: "",
  });

  function resetForm() {
    setForm({ amountDollars: "", method: "cash", notes: "" });
    setErr("");
  }

  async function createPayment() {
    if (!targetApptId) return;

    await run(async () => {
      await adminApiFetch("/api/admin/payments", {
        method: "POST",
        body: JSON.stringify({
          appointmentId: targetApptId,
          amountDollars: form.amountDollars,
          method: form.method,
          notes: form.notes,
        }),
      });

      setOpenAdd(false);
      resetForm();
      router.refresh();
    });
  }

  async function updatePayment() {
    if (!editingPayment?.id) return;

    await run(async () => {
      await adminApiFetch(`/api/admin/payments/${editingPayment.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          amountDollars: form.amountDollars,
          method: form.method,
          notes: form.notes,
        }),
      });

      setOpenEdit(false);
      setEditingPayment(null);
      resetForm();
      router.refresh();
    });
  }

  async function deletePayment(paymentId) {
    const ok = confirm("Delete this payment? This cannot be undone.");
    if (!ok) return;

    await run(async () => {
      await adminApiFetch(`/api/admin/payments/${paymentId}`, {
        method: "DELETE",
      });
      router.refresh();
    });
  }

  function openAddForAppt(apptId) {
    setTargetApptId(apptId);
    resetForm();
    setOpenAdd(true);
  }

  function openEditForPayment(payment, apptId) {
    setTargetApptId(apptId);
    setEditingPayment(payment);

    setForm({
      amountDollars: payment?.amountCents
        ? (payment.amountCents / 100).toFixed(2)
        : "",
      method: payment?.method || "cash",
      notes: payment?.notes || "",
    });

    setErr("");
    setOpenEdit(true);
  }

  return (
    <div className="space-y-3">
      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {appointments.map((a) => (
        <div key={a.id} className="rounded-lg border bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium">{a.service}</div>
              <div className="text-xs text-gray-500">
                {a.startAt
                  ? new Date(a.startAt).toLocaleDateString()
                  : a.createdAt
                    ? new Date(a.createdAt).toLocaleDateString()
                    : "No date"}
              </div>
            </div>

            <button
              onClick={() => openAddForAppt(a.id)}
              className="rounded-md bg-pink-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              disabled={saving}
            >
              + Add payment
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {(a.payments || []).length === 0 ? (
              <div className="text-sm text-gray-400">No payments recorded.</div>
            ) : (
              (a.payments || []).map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-md bg-gray-50 px-3 py-2"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      {money(p.amountCents)} • {String(p.method || "other")}
                    </div>
                    {p.notes ? (
                      <div className="mt-0.5 whitespace-pre-line text-xs text-gray-500">
                        {p.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForPayment(p, a.id)}
                      className="rounded-md border px-2 py-1 text-xs"
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePayment(p.id)}
                      className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs text-red-600"
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      {/* Add Modal */}
      {openAdd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Add Payment</h3>
              <button
                onClick={() => setOpenAdd(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Amount (USD)
                </label>
                <input
                  value={form.amountDollars}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amountDollars: e.target.value }))
                  }
                  placeholder="45.00"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Method
                </label>
                <select
                  value={form.method}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, method: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Optional note (e.g. paid in full, partial payment, etc)"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpenAdd(false)}
                  className="rounded-lg border px-3 py-2 text-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={createPayment}
                  className="rounded-lg bg-pink-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Modal */}
      {openEdit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Edit Payment</h3>
              <button
                onClick={() => setOpenEdit(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Amount (USD)
                </label>
                <input
                  value={form.amountDollars}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amountDollars: e.target.value }))
                  }
                  placeholder="45.00"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Method
                </label>
                <select
                  value={form.method}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, method: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpenEdit(false)}
                  className="rounded-lg border px-3 py-2 text-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={updatePayment}
                  className="rounded-lg bg-pink-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
