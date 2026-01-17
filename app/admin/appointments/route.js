// app/api/admin/appointments/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdmin } from "@/lib/adminAuth";

export async function POST(req) {
  try {
    // ✅ Enforce the same admin key model as /api/admin/clients
    assertAdmin(req);

    const body = await req.json();

    const {
      clientId,
      service,
      status = "completed",
      notes,
      startAt,
      endAt,
      priceCents,
      paymentType,
    } = body;

    if (!clientId || !service) {
      return new NextResponse(
        JSON.stringify({ error: "clientId and service are required" }),
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        service,
        status,
        notes: notes || null,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        priceCents: typeof priceCents === "number" ? priceCents : null,
        paymentType: paymentType || null,
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    console.error("Error creating appointment:", err);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create appointment" }),
      { status: 500 }
    );
  }
}
