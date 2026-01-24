// app/api/admin/clients/[id]/pets/route.js
import prisma from "@/lib/prisma";
import { assertAdmin } from "@/lib/adminAuth";

export async function GET(req, { params }) {
  const auth = assertAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.reason }, { status: 401 });
  }

  const { id: clientId } = params;

  const pets = await prisma.pet.findMany({
    where: {
      clientId,
      deletedAt: null, // if you’re using soft delete; remove if not
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      age: true,
      notes: true,
      createdAt: true,
    },
  });

  return Response.json({ pets });
}

export async function POST(req, { params }) {
  const auth = assertAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.reason }, { status: 401 });
  }

  const { id: clientId } = params;

  let body = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) {
    return Response.json({ error: "Pet name is required" }, { status: 400 });
  }

  const species = (body.species || "").trim();
  const breed = body.breed?.trim() || null;
  const notes = body.notes?.trim() || null;

  let age = null;
  if (body.age !== undefined && body.age !== null && body.age !== "") {
    const parsed = Number(body.age);
    if (Number.isFinite(parsed) && parsed > 0) {
      age = parsed;
    }
  }

  const pet = await prisma.pet.create({
    data: {
      clientId,
      name,
      species,
      breed,
      age,
      notes,
    },
    select: {
      id: true,
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
