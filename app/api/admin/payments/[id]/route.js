// app/api/admin/payments/[id]/route.js
import prisma from "@/lib/prisma";
import { assertAdmin } from "@/lib/adminAuth";

function toCents(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.round(x) : 0;
}

export async function PATCH(req, { params }) {
  const auth = assertAdmin(req);
  if (!auth.ok) {
    return Response.json(
      { error: auth.reason || "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = params;

  const body = await req.json().catch(() => ({}));
  const { amountCents, amountDollars, method, notes, status, paidAt } = body;

  const data = {};

  if (amountCents != null || amountDollars != null) {
    const amt =
      amountCents != null
        ? toCents(amountCents)
        : toCents(Number(amountDollars) * 100);

    if (!amt || amt <= 0) {
      return Response.json({ error: "amount must be > 0" }, { status: 400 });
    }
    data.amountCents = amt;
  }

  if (method != null) data.method = String(method).toLowerCase();
  if (notes !== undefined) data.notes = notes || null;
  if (status != null) data.status = String(status);
  if (paidAt != null) data.paidAt = new Date(paidAt);

  const payment = await prisma.payment.update({
    where: { id },
    data,
  });

  return Response.json({ payment });
}

export async function DELETE(req, { params }) {
  const auth = assertAdmin(req);
  if (!auth.ok) {
    return Response.json(
      { error: auth.reason || "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = params;

  // You already filter by deletedAt: null in your queries,
  // so we can safely soft-delete here.
  await prisma.payment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return Response.json({ ok: true });
}
