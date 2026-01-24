// components/dashboard/ClientActionsBar.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApiFetch } from "@/lib/adminApiClient";
import { useAdminMutation } from "@/hooks/useAdminMutation";

export default function ClientActionsBar({ client, pets = [] }) {
  const router = useRouter();
  const { saving, err, run } = useAdminMutation();

  const [openEdit, setOpenEdit] = useState(false);
  const [openPet, setOpenPet] = useState(false);

  const [form, setForm] = useState({
    fullName: client.fullName || "",
    email: client.email || "",
    phone: client.phone || "",
    address: client.address || "",
    notes: client.notes || "",
  });

  // 🔹 Pet editing state
  const [editingPetId, setEditingPetId] = useState("NEW"); // "NEW" or pet.id
  const [petForm, setPetForm] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    notes: "",
  });

  // When modal opens or selected pet changes, hydrate form
  useEffect(() => {
    if (!openPet) return;

    if (!editingPetId || editingPetId === "NEW") {
      setPetForm({
        name: "",
        species: "",
        breed: "",
        age: "",
        notes: "",
      });
      return;
    }

    const pet = pets.find((p) => p.id === editingPetId);
    if (!pet) return;

    setPetForm({
      name: pet.name || "",
      species: pet.species || "",
      breed: pet.breed || "",
      age: pet.age != null ? String(pet.age) : "",
      notes: pet.notes || "",
    });
  }, [openPet, editingPetId, pets]);

  // ========= Client edit =========
  async function saveClient() {
    await run(async () => {
      const payload = {
        fullName: (form.fullName || "").trim(),
        email: form.email?.trim() || "",
        phone: form.phone?.trim() || "",
        address: form.address?.trim() || "",
        notes: form.notes?.trim() || "",
      };

      if (!payload.fullName) {
        throw new Error("Full name is required.");
      }

      await adminApiFetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setOpenEdit(false);
      router.refresh();
    });
  }

  async function deleteClient() {
    const ok = confirm(
      "Delete this client and all related pets/appointments/payments? This cannot be undone."
    );
    if (!ok) return;

    await run(async () => {
      await adminApiFetch(`/api/admin/clients/${client.id}`, {
        method: "DELETE",
      });
      router.push("/admin/clients");
      router.refresh();
    });
  }

  // ========= Pets: add / edit / delete =========

  async function savePet() {
    await run(async () => {
      const name = (petForm.name || "").trim();
      if (!name) {
        throw new Error("Pet name is required.");
      }

      const payload = {
        name,
        species: petForm.species?.trim() || "",
        breed: petForm.breed?.trim() || null,
        notes: petForm.notes?.trim() || null,
      };

      const ageNum = Number(petForm.age);
      if (petForm.age && Number.isFinite(ageNum) && ageNum > 0) {
        payload.age = ageNum;
      }

      const isNew = !editingPetId || editingPetId === "NEW";

      if (isNew) {
        // CREATE
        await adminApiFetch(`/api/admin/clients/${client.id}/pets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // UPDATE
        await adminApiFetch(
          `/api/admin/clients/${client.id}/pets/${editingPetId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      setOpenPet(false);
      setEditingPetId("NEW");
      setPetForm({ name: "", species: "", breed: "", age: "", notes: "" });
      router.refresh();
    });
  }

  async function deletePet() {
    if (!editingPetId || editingPetId === "NEW") return;

    const pet = pets.find((p) => p.id === editingPetId);
    const label = pet?.name ? `Delete ${pet.name}?` : "Delete this pet?";

    const ok = confirm(
      `${label} This will remove the pet from this client and cannot be undone.`
    );
    if (!ok) return;

    await run(async () => {
      await adminApiFetch(
        `/api/admin/clients/${client.id}/pets/${editingPetId}`,
        {
          method: "DELETE",
        }
      );

      setOpenPet(false);
      setEditingPetId("NEW");
      setPetForm({ name: "", species: "", breed: "", age: "", notes: "" });
      router.refresh();
    });
  }

  // ========= UI =========

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
          onClick={() => {
            setEditingPetId("NEW");
            setOpenPet(true);
          }}
          className="rounded-lg border px-3 py-2 text-sm"
          disabled={saving}
        >
          Add / edit pets
        </button>

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

      {/* Edit Client Modal */}
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

      {/* Add / Edit Pet Modal */}
      {openPet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                {editingPetId && editingPetId !== "NEW"
                  ? "Edit Pet"
                  : "Add Pet"}
              </h3>
              <button
                onClick={() => setOpenPet(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Pet selector if there are existing pets */}
            {pets.length > 0 && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-gray-600">
                  Pet to edit
                </label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={editingPetId || "NEW"}
                  onChange={(e) => setEditingPetId(e.target.value)}
                >
                  <option value="NEW">➕ Add new pet</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || "Unnamed pet"}{" "}
                      {p.species ? `• ${p.species}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-3 grid gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Pet name
                </label>
                <input
                  value={petForm.name}
                  onChange={(e) =>
                    setPetForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">
                    Species
                  </label>
                  <input
                    value={petForm.species}
                    onChange={(e) =>
                      setPetForm((p) => ({ ...p, species: e.target.value }))
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">
                    Breed
                  </label>
                  <input
                    value={petForm.breed}
                    onChange={(e) =>
                      setPetForm((p) => ({ ...p, breed: e.target.value }))
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Age (years)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={petForm.age}
                  onChange={(e) =>
                    setPetForm((p) => ({ ...p, age: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Notes
                </label>
                <textarea
                  value={petForm.notes}
                  onChange={(e) =>
                    setPetForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Temperament, meds, feeding instructions…"
                />
              </div>

              <div className="mt-2 flex justify-between gap-2">
                {editingPetId && editingPetId !== "NEW" ? (
                  <button
                    onClick={deletePet}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600"
                    disabled={saving}
                  >
                    Delete pet
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setOpenPet(false);
                      setEditingPetId("NEW");
                    }}
                    className="rounded-lg border px-3 py-2 text-sm"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={savePet}
                    className="rounded-lg bg-pink-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save pet"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
