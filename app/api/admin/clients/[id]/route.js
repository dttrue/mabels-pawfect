// app/api/admin/clients/[id]/route.js
import prisma from "@/lib/prisma";
import { assertAdmin } from "@/lib/adminAuth";

/* ----------------------------- GET (detail) ----------------------------- */
export async function GET(req, { params }) {
  const auth = assertAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.reason }, { status: 401 });
  }

  const { id } = params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      createdAt: true,

      pets: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          age: true,
          notes: true,
        },
      },

      appointments: {
        where: { deletedAt: null },
        orderBy: { startAt: "desc" },
        select: {
          id: true,
          service: true,
          status: true,
          priceCents: true,
          startAt: true,
          endAt: true,
          createdAt: true,
          notes: true,
          payments: {
            where: { deletedAt: null },
            select: {
              id: true,
              amountCents: true,
              method: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!client) {
    return Response.json({ error: "Client not found" }, { status: 404 });
  }

  return Response.json({ client });
}

/* ---------------------------- PATCH (edit) ---------------------------- */
export async function PATCH(req, { params }) {
  const auth = assertAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.reason }, { status: 401 });
  }

  const { id } = params;

  let body = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = {};

  if (typeof body.fullName === "string") {
    const fullName = body.fullName.trim();
    if (!fullName) {
      return Response.json(
        { error: "fullName cannot be empty" },
        { status: 400 }
      );
    }
    data.fullName = fullName;
  }

  if (typeof body.phone === "string") {
    data.phone = body.phone.trim() || null;
  }

  if (typeof body.email === "string") {
    data.email = body.email.trim().toLowerCase() || null;
  }

  if (typeof body.address === "string") {
    data.address = body.address.trim() || null;
  }

  if (typeof body.notes === "string") {
    data.notes = body.notes.trim() || null;
  }

  if (!Object.keys(data).length) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const client = await prisma.client.update({
    where: { id },
    data,
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      createdAt: true,
    },
  });

  return Response.json({ client });
}

/* --------------------------- DELETE (soft) --------------------------- */
export async function DELETE(req, { params }) {
  const auth = assertAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.reason }, { status: 401 });
  }

  const { id } = params;
  const now = new Date();

  try {
    await prisma.$transaction([
      prisma.payment.updateMany({
        where: { clientId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.appointment.updateMany({
        where: { clientId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.pet.updateMany({
        where: { clientId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.client.update({
        where: { id },
        data: { deletedAt: now },
      }),
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Delete client failed", err);
    return Response.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
