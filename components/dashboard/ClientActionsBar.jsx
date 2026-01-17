// components/dashboard/ClientActionsBar.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApiFetch } from "@/lib/adminApiClient";
import { useAdminMutation } from "@/hooks/useAdminMutation";

export default function ClientActionsBar({ client }) {
  const router = useRouter();
  const { saving, err, run } = useAdminMutation();

  const [openEdit, setOpenEdit] = useState(false);
  const [form, setForm] = useState({
    fullName: client.fullName || "",
    email: client.email || "",
    phone: client.phone || "",
    address: client.address || "",
    notes: client.notes || "",
  });

  async function saveClient() {
    await run(async () => {
      await adminApiFetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setOpenEdit(false);
      router.refresh();
    });
  }

  async function deleteClient() {
    const ok = confirm("Delete this client? This cannot be undone.");
    if (!ok) return;

    await run(async () => {
      await adminApiFetch(`/api/admin/clients/${client.id}`, {
        method: "DELETE",
      });
      router.push("/admin/clients");
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      {err ? (
        <div className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setOpenEdit(true)}
          className="rounded-lg border px-3 py-2 text-sm"
          disabled={saving}
        >
          Edit client
        </button>
        <button
          onClick={deleteClient}
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600"
          disabled={saving}
        >
          Delete
        </button>
      </div>

      {openEdit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Edit Client</h3>
              <button
                onClick={() => setOpenEdit(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 grid gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Full name
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">
                    Email
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
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
                  rows={4}
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
                  onClick={saveClient}
                  className="rounded-lg bg-pink-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
