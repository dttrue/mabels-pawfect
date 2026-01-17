// components/dashboard/clients.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Button,
  Spinner,
  Badge,
  Alert,
  TextInput,
  Card,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";

import { adminApiFetch } from "@/lib/adminApiClient";

function money(cents = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents || 0) / 100);
}

function formatDate(d) {
  try {
    return d ? new Date(d).toLocaleDateString() : "—";
  } catch {
    return "—";
  }
}

// ✅ must match lib/adminApiClient.js
const ADMIN_KEY_STORAGE = "adminKey";

function clearStoredAdminKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_KEY_STORAGE);
}

export function AdminClientsPage() {
  const [q, setQ] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add Client modal state
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  function resetForm() {
    setForm({
      fullName: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
  }

  async function load(query = "") {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await adminApiFetch(
        `/api/admin/clients?q=${encodeURIComponent(query)}`,
        { method: "GET" }
      );

      setClients(data.clients || []);
    } catch (e) {
      setClients([]);
      setError(e?.message || "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  }

  async function createClient() {
    setSaving(true);
    setError("");
    setSuccess("");

    const fullName = (form.fullName || "").trim();
    if (!fullName) {
      setSaving(false);
      setError("Full name is required.");
      return;
    }

    try {
      await adminApiFetch("/api/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          phone: form.phone?.trim() || null,
          email: form.email?.trim()?.toLowerCase() || null,
          address: form.address?.trim() || null,
          notes: form.notes?.trim() || null,
        }),
      });

      setShowAdd(false);
      resetForm();
      setSuccess("Client added.");
      await load(q);
    } catch (e) {
      // Most common case: missing/wrong key
      const msg = e?.message || "Failed to add client.";
      if (msg.toLowerCase().includes("unauthorized")) {
        setError(
          "Unauthorized. Your admin key is missing/wrong. Click “Reset admin key”, reload, and enter it again."
        );
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasClients = clients && clients.length > 0;

  const subtitle = useMemo(() => {
    if (loading) return "Loading clients…";
    if (error) return "Could not load clients";
    if (!hasClients) return "No clients yet — add Rover clients manually.";
    return `${clients.length} client${clients.length === 1 ? "" : "s"}`;
  }, [loading, error, hasClients, clients.length]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <TextInput
            className="w-full sm:w-80"
            placeholder="Search name, email, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={() => load(q)} disabled={loading}>
              Search
            </Button>
            <Button
              color="light"
              onClick={() => {
                setQ("");
                load("");
              }}
              disabled={loading}
            >
              Reset
            </Button>
            <Button color="pink" onClick={() => setShowAdd(true)}>
              Add Client
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          color="light"
          size="xs"
          onClick={() => {
            clearStoredAdminKey();
            setSuccess("Admin key cleared. Reload and enter it again.");
          }}
        >
          Reset admin key
        </Button>
      </div>

      {error ? (
        <Alert color="failure" className="mt-4">
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert color="success" className="mt-4">
          {success}
        </Alert>
      ) : null}

      {/* Desktop table */}
      <div className="mt-6 hidden md:block">
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Pets</th>
                <th className="px-4 py-3 font-semibold">Bookings</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Last Visit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Spinner size="sm" />
                      <span>Loading…</span>
                    </div>
                  </td>
                </tr>
              ) : !hasClients ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-600">
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">
                        {c.fullName || "Unnamed"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {c.email || "No email"} • {c.phone || "No phone"}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <Badge color={c.status === "client" ? "success" : "gray"}>
                        {c.status === "client" ? "Client" : "Lead"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 align-top">{c.petsCount ?? 0}</td>
                    <td className="px-4 py-3 align-top">
                      {c.appointmentsCount ?? 0}
                    </td>

                    <td className="px-4 py-3 align-top font-semibold">
                      {money(c.totalRevenueCents)}
                    </td>

                    <td className="px-4 py-3 align-top text-gray-600">
                      {formatDate(c.lastAppointmentAt)}
                    </td>

                    <td className="px-4 py-3 align-top text-right">
                      <Button
                        size="xs"
                        color="light"
                        as={Link}
                        href={`/admin/clients/${c.id}`}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 md:hidden">
        {loading ? (
          <Card>
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-gray-600">Loading…</span>
            </div>
          </Card>
        ) : !hasClients ? (
          <Card>
            <div className="text-gray-700 font-medium">No clients found</div>
            <div className="text-sm text-gray-500">
              Add Rover clients manually so you can track pets, visits, and
              payments.
            </div>
          </Card>
        ) : (
          clients.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold">
                    {c.fullName || "Unnamed"}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {c.phone || "No phone"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {c.email || "No email"}
                  </div>
                </div>

                <Badge color={c.status === "client" ? "success" : "gray"}>
                  {c.status === "client" ? "Client" : "Lead"}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-xs text-gray-500">Pets</div>
                  <div className="font-semibold">{c.petsCount ?? 0}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-xs text-gray-500">Bookings</div>
                  <div className="font-semibold">
                    {c.appointmentsCount ?? 0}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="font-semibold">
                    {money(c.totalRevenueCents)}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Last visit:{" "}
                  <span className="font-medium">
                    {formatDate(c.lastAppointmentAt)}
                  </span>
                </div>
                <Button
                  size="sm"
                  color="light"
                  as={Link}
                  href={`/admin/clients/${c.id}`}
                >
                  View
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Client Modal */}
      <Modal show={showAdd} onClose={() => setShowAdd(false)}>
        <ModalHeader>Add Client</ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Full name (required)
              </label>
              <TextInput
                id="fullName"
                value={form.fullName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fullName: e.target.value }))
                }
                placeholder="Jane Doe"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Phone
              </label>
              <TextInput
                id="phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <TextInput
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Address
              </label>
              <TextInput
                id="address"
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="123 Main St, South Amboy, NJ"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Anything helpful (keys, temperament, preferences, etc)…"
              />
            </div>

            <div className="text-xs text-gray-500">
              Tip: After you add the client, open their profile to add pets and
              visits.
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="pink" onClick={createClient} disabled={saving}>
            {saving ? "Saving…" : "Save Client"}
          </Button>
          <Button
            color="light"
            onClick={() => {
              setShowAdd(false);
              resetForm();
            }}
            disabled={saving}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </main>
  );
}
