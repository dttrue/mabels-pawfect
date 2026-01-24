// app/api/admin/appointments/[id]/route.js
import prisma from "@/lib/prisma";
import { assertAdmin } from "@/lib/adminAuth";

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

  // Service name
  if (typeof body.service === "string") {
    const service = body.service.trim();
    if (service) data.service = service;
  }

  // Status: scheduled | completed | cancelled | no-show | etc
  if (typeof body.status === "string") {
    const status = body.status.trim();
    if (status) data.status = status;
  }

  // Notes
  if (typeof body.notes === "string") {
    data.notes = body.notes.trim() || null;
  }

  // Start date/time (optional) — expect ISO string from the client
  if (typeof body.startAt === "string" && body.startAt.trim()) {
    const d = new Date(body.startAt);
    if (!Number.isFinite(d.getTime())) {
      return Response.json(
        { error: "Invalid startAt datetime" },
        { status: 400 }
      );
    }
    data.startAt = d;
  }

  if (!Object.keys(data).length) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data,
    select: {
      id: true,
      clientId: true,
      service: true,
      status: true,
      startAt: true,
      endAt: true,
      notes: true,
      updatedAt: true,
    },
  });

  return Response.json({ appointment });
}

export async function DELETE(req, { params }) {
  const auth = assertAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.reason }, { status: 401 });
  }

  const { id } = params;
  const now = new Date();

  // Soft-delete appointment + its payments
  await prisma.appointment.update({
    where: { id },
    data: {
      deletedAt: now,
      payments: {
        updateMany: {
          where: { deletedAt: null },
          data: { deletedAt: now },
        },
      },
    },
  });

  return new Response(null, { status: 204 });
}
