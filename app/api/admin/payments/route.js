// app/api/admin/payments/route.js
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

function toCents(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.round(x) : 0;
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin.authorized) {
    return Response.json(
      { error: "Unauthorized" },
      { status: admin.reason === "SIGNED_OUT" ? 401 : 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { appointmentId, amountCents, amountDollars, method, notes } = body;

  if (!appointmentId) {
    return Response.json(
      { error: "appointmentId is required" },
      { status: 400 }
    );
  }

  // Prefer raw cents if passed, else derive from dollars
  const amt = Number.isFinite(Number(amountCents))
    ? toCents(amountCents)
    : toCents(Number(amountDollars) * 100);

  if (!amt || amt <= 0) {
    return Response.json({ error: "amount is required" }, { status: 400 });
  }

  // Get clientId from appointment so Payment can be linked properly
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, clientId: true },
  });

  if (!appt) {
    return Response.json({ error: "Appointment not found" }, { status: 404 });
  }

  const payment = await prisma.payment.create({
    data: {
      appointmentId: appt.id,
      clientId: appt.clientId,
      amountCents: amt,
      currency: "usd",
      method: (method || "other").toLowerCase(),
      status: "paid",
      paidAt: new Date(),
      notes: notes || null,
      // deletedAt stays null on create
    },
  });

  return Response.json({ payment }, { status: 201 });
}
