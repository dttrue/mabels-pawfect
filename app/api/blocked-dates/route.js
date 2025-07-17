// app/api/block-date/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// hardcoded for now
const BLOCKED_SERVICE = "overnight"; // hardcoded for now

// 🆕 POST /api/blocked-dates
export async function POST(req) {
  const { date } = await req.json();
  console.log("📥 Incoming block request for date:", date);

  if (!date) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  console.log(
    "🕵️ Checking between:",
    startOfDay.toISOString(),
    "and",
    endOfDay.toISOString()
  );

  const existing = await prisma.blockedDate.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      service: "overnight",
    },
  });

  if (existing) {
    console.warn("⚠️ Already blocked:", existing.date.toISOString());
    return NextResponse.json(
      { error: "This overnight is already blocked." },
      { status: 409 }
    );
  }

  const created = await prisma.blockedDate.create({
    data: {
      date: startOfDay,
      service: "overnight",
    },
  });

  console.log("✅ Successfully blocked date:", created.date.toISOString());

  return NextResponse.json({ success: true });
}




// ❌ DELETE /api/blocked-dates
export async function DELETE(req) {
  const { date } = await req.json();

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const isoDate = new Date(date).toISOString().split("T")[0]; // '2025-06-18'

 

  const result = await prisma.blockedDate.deleteMany({
    where: {
      date: {
        gte: new Date(`${isoDate}T00:00:00.000Z`),
        lt: new Date(`${isoDate}T23:59:59.999Z`),
      },
      service: "overnight",
    },
  });


  console.log("✅ Deleted Result:", result);


  return NextResponse.json({ message: "Date unblocked" });
}


// ✅ GET /api/blocked-dates?service=overnight
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get("service")?.toLowerCase();

    if (!service) {
      return NextResponse.json(
        { error: "Missing service parameter" },
        { status: 400 }
      );
    }

    const blockedDates = await prisma.blockedDate.findMany({
      where: { service },
      orderBy: { date: "asc" },
    });

    // Return just ISO dates (YYYY-MM-DD) for frontend simplicity
    const dates = blockedDates.map(
      (entry) => entry.date.toISOString().split("T")[0]
    );

    return NextResponse.json(dates);
  } catch (err) {
    console.error("Blocked date fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

