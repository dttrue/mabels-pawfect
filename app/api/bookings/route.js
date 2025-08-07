// app/api/bookings/route.js
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { generateBookingRequestEmail } from "@/lib/emails/generateBookingRequestEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { fullName, email, phone, address, pets, service, notes, entries } =
      await req.json();

    const lowerService = service.toLowerCase();
    const isOvernightService = lowerService.includes("overnight");

    const overnightBlockStart = new Date("2025-06-27");
    const overnightBlockEnd = new Date("2025-08-02");
    overnightBlockEnd.setHours(23, 59, 59, 999);

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "At least one booking date is required." },
        { status: 400 }
      );
    }

    const failedDates = [];
    const validEntries = [];

    for (const { date, time } of entries) {
      const requestedDate = new Date(`${date}T${time}`);

      if (
        isOvernightService &&
        requestedDate >= overnightBlockStart &&
        requestedDate <= overnightBlockEnd
      ) {
        failedDates.push({ date, reason: "Blocked overnight range" });
        continue;
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const isBlocked = await prisma.blockedDate.findFirst({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          service: lowerService,
        },
      });

      if (isBlocked) {
        failedDates.push({ date, reason: "Admin blocked this day" });
        continue;
      }

      const existingBookings = await prisma.booking.findMany({
        where: {
          service,
          status: "accepted",
        },
      });

      const hasConflict = existingBookings.some((booking) => {
        if (!Array.isArray(booking.entries)) return false;
        return booking.entries.some((entry) => {
          const booked = new Date(`${entry.date}T${entry.time}`);
          const bufferMs = 15 * 60 * 1000;
          return (
            Math.abs(booked.getTime() - requestedDate.getTime()) <= bufferMs
          );
        });
      });

      if (hasConflict) {
        failedDates.push({
          date,
          reason: "Time conflict with another booking",
        });
        continue;
      }

      if (!time) {
        failedDates.push({ date, reason: "Missing time" });
        continue;
      }

      const hour = requestedDate.getHours();
      if (hour < 6 || hour >= 23) {
        failedDates.push({ date, reason: "Outside 6 AM – 11 PM window" });
        continue;
      }

      validEntries.push({ date, time });
    }

    if (!validEntries.length) {
      return NextResponse.json(
        {
          error: "All selected dates failed validation.",
          failedDates,
        },
        { status: 400 }
      );
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const booking = await prisma.booking.create({
      data: {
        fullName,
        email,
        phone,
        address,
        pets,
        service,
        entries: validEntries,
        notes,
        status: "pending",
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptUrl = `${baseUrl}/api/bookings/${token}/accept`;
    const declineUrl = `${baseUrl}/api/bookings/${token}/decline`;

    const html = generateBookingRequestEmail({
      fullName,
      phone,
      address,
      service,
      entries: validEntries,
      pets,
      notes,
      acceptUrl,
      declineUrl,
    });

    const emailResult = await resend.emails.send({
      from: "Mabel's Pawfect <no-reply@mabelspawfectpetservices.com>",
      to: "therainbowniche@gmail.com",
      subject: `New Booking Request from ${fullName} at ${new Date().toLocaleTimeString()}`,
      html,
    });

    console.log("📬 Booking email result:", emailResult);
    console.log("📧 Accept:", acceptUrl);
    console.log("❌ Decline:", declineUrl);

    return NextResponse.json(
      {
        bookings: [booking],
        failedDates,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
