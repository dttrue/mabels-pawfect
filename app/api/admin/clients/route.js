// app/api/admin/clients/route.js
// ✅ Returns lightweight client rows for the dashboard
// ✅ Supports search via ?q=
// ✅ Computes pets/bookings/revenue/lastVisit without shipping huge nested payloads
// ✅ Safer revenue math (null guards) + last visit uses startAt/endAt fallback

import prisma from "@/lib/prisma";
import { assertAdmin } from "@/lib/adminAuth";

function toCents(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function bestDateMs(a) {
  // Prefer actual appointment times if you have them, else fall back.
  const d = a.startAt || a.endAt || a.createdAt || a.updatedAt;
  const ms = d ? new Date(d).getTime() : 0;
  return Number.isFinite(ms) ? ms : 0;
}

export async function GET(req) {
  const auth = assertAdmin(req);
  if (!auth.ok) return Response.json({ error: auth.reason }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // ✅ Pull only what we need for dashboard aggregates
  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      createdAt: true,

      // pets count (only non-deleted)
      pets: {
        where: { deletedAt: null },
        select: { id: true },
      },

      // appts + payments (only non-deleted)
      appointments: {
        where: { deletedAt: null },
        select: {
          id: true,
          status: true,
          priceCents: true,
          startAt: true,
          endAt: true,
          createdAt: true,
          updatedAt: true,
          payments: {
            where: { deletedAt: null },
            select: {
              id: true,
              amountCents: true,
            },
          },
        },
      },
    },
  });

  const rows = clients.map((c) => {
    const appts = c.appointments || [];

    const payments = appts.flatMap((a) => a.payments || []);
    const totalPaidCents = payments.reduce(
      (sum, p) => sum + toCents(p.amountCents),
      0
    );

    // Fallback revenue if no payments exist yet (manual bookings / cash not recorded)
    const fallbackCents = appts.reduce(
      (sum, a) => sum + toCents(a.priceCents),
      0
    );

    const completedCount = appts.filter((a) => a.status === "completed").length;
    const hasPayment = payments.length > 0;

    const lastMs = appts.reduce((best, a) => {
      const ms = bestDateMs(a);
      return ms > best ? ms : best;
    }, 0);

    return {
      id: c.id,
      fullName: c.fullName,
      phone: c.phone,
      email: c.email,

      petsCount: c.pets?.length || 0,
      appointmentsCount: appts.length,

      totalRevenueCents: totalPaidCents > 0 ? totalPaidCents : fallbackCents,
      lastAppointmentAt: lastMs ? new Date(lastMs).toISOString() : null,

      status: hasPayment || completedCount > 0 ? "client" : "lead",
      createdAt: c.createdAt,
    };
  });

  return Response.json({ clients: rows });
}

export async function POST(req) {
  const auth = assertAdmin(req);
  if (!auth.ok) return Response.json({ error: auth.reason }, { status: 401 });

  let body = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fullName = (body.fullName || "").trim();
  if (!fullName) {
    return Response.json({ error: "fullName is required" }, { status: 400 });
  }

  const phone = body.phone?.trim() || null;
  const email = body.email?.trim()?.toLowerCase() || null;
  const address = body.address?.trim() || null;
  const notes = body.notes?.trim() || null;

  const pets = Array.isArray(body.pets) ? body.pets : [];
  const appointments = Array.isArray(body.appointments)
    ? body.appointments
    : [];

  // ✅ Optional: prevent duplicates by email
  if (email) {
    const existing = await prisma.client.findFirst({
      where: { email, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      return Response.json(
        { error: "Client with that email already exists", id: existing.id },
        { status: 409 }
      );
    }
  }

  const client = await prisma.client.create({
    data: {
      fullName,
      phone,
      email,
      address,
      notes,

      // 🔹 Nested pets (optional)
      ...(pets.length
        ? {
            pets: {
              create: pets.map((p) => ({
                name: (p.name || "").trim(),
                species: (p.species || "").trim(),
                breed: p.breed?.trim() || null,
                age:
                  typeof p.age === "number" && Number.isFinite(p.age)
                    ? p.age
                    : null,
                notes: p.notes?.trim() || null,
              })),
            },
          }
        : {}),

      // 🔹 Nested appointments (optional) – manual visit + payment record
      ...(appointments.length
        ? {
            appointments: {
              create: appointments.map((a) => ({
                service: (a.service || "Visit").trim(),
                status: (a.status || "completed").trim(),
                notes: a.notes?.trim() || null,
                startAt: a.startAt ? new Date(a.startAt) : null,
                endAt: a.endAt ? new Date(a.endAt) : null,
                priceCents:
                  typeof a.priceCents === "number" &&
                  Number.isFinite(a.priceCents)
                    ? a.priceCents
                    : null,
                paymentType: a.paymentType?.trim() || null,
              })),
            },
          }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      createdAt: true,
    },
  });

  return Response.json({ client });
}

