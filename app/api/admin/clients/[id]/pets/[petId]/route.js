// app/api/admin/clients/[id]/pets/[petId]/route.js
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req, { params }) {
  const admin = await requireAdmin();
  if (!admin.authorized) {
    return Response.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  const { petId } = params;

  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: {
      id: true,
      clientId: true,
      name: true,
      species: true,
      breed: true,
      age: true,
      notes: true,
      createdAt: true,
      deletedAt: true,
    },
  });

  if (!pet || pet.deletedAt) {
    return Response.json({ error: "Pet not found" }, { status: 404 });
  }

  return Response.json({ pet });
}

export async function PATCH(req, { params }) {
  const admin = await requireAdmin();
  if (!admin.authorized) {
    return Response.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  const { petId } = params;

  let body = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return Response.json({ error: "name cannot be empty" }, { status: 400 });
    }
    data.name = name;
  }

  if (typeof body.species === "string") {
    data.species = body.species.trim();
  }

  if (typeof body.breed === "string") {
    data.breed = body.breed.trim() || null;
  }

  if (typeof body.notes === "string") {
    data.notes = body.notes.trim() || null;
  }

  if (body.age !== undefined) {
    if (body.age === null || body.age === "") {
      data.age = null;
    } else {
      const parsed = Number(body.age);
      if (Number.isFinite(parsed) && parsed > 0) {
        data.age = parsed;
      }
    }
  }

  if (!Object.keys(data).length) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const pet = await prisma.pet.update({
    where: { id: petId },
    data,
    select: {
      id: true,
      clientId: true,
      name: true,
      species: true,
      breed: true,
      age: true,
      notes: true,
      createdAt: true,
    },
  });

  return Response.json({ pet });
}

export async function DELETE(req, { params }) {
  const admin = await requireAdmin();
  if (!admin.authorized) {
    return Response.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  const { petId } = params;
  const now = new Date();

  try {
    await prisma.pet.update({
      where: { id: petId },
      data: { deletedAt: now },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete pet", err);
    return Response.json({ error: "Failed to delete pet" }, { status: 500 });
  }
}
