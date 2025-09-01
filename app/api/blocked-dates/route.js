import { normalizeServiceKey } from "@/utils/serviceKeys";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// 🟢 POST /api/blocked-dates
export async function POST(req) {
  const { date, service } = await req.json();
  const svc = normalizeServiceKey(service || "overnight"); // ← normalize
  if (!date)
    return NextResponse.json({ error: "Missing date" }, { status: 400 });

  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const existing = await prisma.blockedDate.findFirst({
    where: { service: svc, date: { gte: startOfDay, lte: endOfDay } },
  });
  if (existing)
    return NextResponse.json({ error: "Already blocked." }, { status: 409 });

  await prisma.blockedDate.create({ data: { date: startOfDay, service: svc } });
  return NextResponse.json({ success: true });
}

// 🟢 DELETE /api/blocked-dates
export async function DELETE(req) {
  const { date, service } = await req.json();
  const svc = normalizeServiceKey(service || "overnight");

  const iso = new Date(date).toISOString().split("T")[0];
  const result = await prisma.blockedDate.deleteMany({
    where: {
      service: svc,
      date: {
        gte: new Date(`${iso}T00:00:00.000Z`),
        lt: new Date(`${iso}T23:59:59.999Z`),
      },
    },
  });
  return NextResponse.json({ ok: true, deleted: result.count });
}

// 🟢 GET /api/blocked-dates?service=overnight
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const svcRaw = searchParams.get("service") || "overnight";
    const service = normalizeServiceKey(svcRaw); // ← normalize

    const rows = await prisma.blockedDate.findMany({
      where: { service },
      orderBy: { date: "asc" },
    });

    const dates = rows.map((r) => r.date.toISOString().split("T")[0]);
    return NextResponse.json(dates);
  } catch (e) {
    console.error("Blocked date fetch error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
