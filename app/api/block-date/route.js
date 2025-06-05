// app/api/block-date/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";



export async function POST(req) {
  try {
    const { date } = await req.json();

    if (!date) {
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0); // normalize

    const existing = await prisma.blockedDate.findUnique({
      where: { date: dateObj },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This day is already blocked." },
        { status: 409 }
      );
    }

    await prisma.blockedDate.create({ data: { date: dateObj } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Block date error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { date } = await req.json();
    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    await prisma.blockedDate.deleteMany({
      where: { date: new Date(date) },
    });

    return NextResponse.json({ message: "Date unblocked" });
  } catch (err) {
    console.error("Unblock error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

