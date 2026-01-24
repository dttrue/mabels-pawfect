"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApiFetch } from "@/lib/adminApiClient";
import { useAdminMutation } from "@/hooks/useAdminMutation";

type Appointment = {
  id: string;
  service?: string | null;
  status?: string | null;
  notes?: string | null;
  startAt?: string | Date | null;
  endAt?: string | Date | null;
  updatedAt?: string | Date | null;
  createdAt?: string | Date | null;
};

type ClientAppointmentEditorProps = {
  appointment: Appointment;
};

function getInitialDateTime(appointment: Appointment) {
  const base =
    appointment.startAt ||
    appointment.endAt ||
    appointment.updatedAt ||
    appointment.createdAt;

  if (!base) return { date: "", time: "" };

  const d = new Date(base);
  if (!Number.isFinite(d.getTime())) return { date: "", time: "" };

  const iso = d.toISOString();
  const date = iso.slice(0, 10); // YYYY-MM-DD
  const time = iso.slice(11, 16); // HH:MM

  return { date, time };
}

export default function ClientAppointmentEditor({
  appointment,
}: ClientAppointmentEditorProps) {
  const router = useRouter();
  const { saving, err, run } = useAdminMutation();

  const initial = getInitialDateTime(appointment);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    service: appointment.service || "",
    status: appointment.status || "scheduled",
    date: initial.date,
    time: initial.time,
    notes: appointment.notes || "",
  });

  async function save() {
    await run(async () => {
      const payload: Record<string, unknown> = {
        service: (form.service || "").trim() || "Visit",
        status: (form.status || "").trim() || "scheduled",
        notes: form.notes?.trim() || "",
      };

      if (form.date) {
        const time = form.time || "12:00";
        const iso = new Date(`${form.date}T${time}:00`).toISOString();
        payload.startAt = iso;
      }

      await adminApiFetch(`/api/admin/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setOpen(false);
      router.refresh();
    });
  }

  async function handleDelete() {
    const ok = confirm(
      "Delete this booking and its payments? This cannot be undone."
    );
    if (!ok) return;

    await run(async () => {
      await adminApiFetch(`/api/admin/appointments/${appointment.id}`, {
        method: "DELETE",
      });

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
        disabled={saving}
      >
        Edit booking
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Edit Booking</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500"
                type="button"
              >
                ✕
              </button>
            </div>

            {err && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {String(err)}
              </div>
            )}

            <div className="mt-3 grid gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Service
                </label>
                <input
                  value={form.service}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, service: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No-show</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, date: e.target.value }))
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">
                      Time
                    </label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, time: e.target.value }))
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
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
                  placeholder="Pickup instructions, special requests…"
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  onClick={handleDelete}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-600"
                  disabled={saving}
                  type="button"
                >
                  Delete booking
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg border px-3 py-2 text-sm"
                    disabled={saving}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    className="rounded-lg bg-pink-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    disabled={saving}
                    type="button"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
