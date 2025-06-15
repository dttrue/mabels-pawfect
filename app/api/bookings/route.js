// app/api/bookings/route.js
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { formatDateWithTime } from "@/utils/formatDateTime";


const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { fullName, email, phone, address, pets, service, notes, entries } =
      await req.json();


    // 🚫 Block Overnight bookings from June 27 to August 2
    const lowerService = service.toLowerCase();
    const isOvernightService = lowerService.includes("overnight");

    const overnightBlockStart = new Date("2025-06-27");
    const overnightBlockEnd = new Date("2025-08-02");
    overnightBlockEnd.setHours(23, 59, 59, 999);


  
    // 🚫 Block out the whole day for Overnight
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "At least one booking date is required." },
        { status: 400 }
      );
    }

    const successfulBookings = [];
    const failedDates = [];

    for (const { date, time } of entries) {
      console.log("📥 Processing entry:", { date, time });
      const requestedDate = new Date(`${date}T${time}`);

      // 1. Blocked overnight range
      if (
        isOvernightService &&
        requestedDate >= overnightBlockStart &&
        requestedDate <= overnightBlockEnd
      ) {
        failedDates.push({ date, reason: "Blocked overnight range" });
        continue;
      }

      // 2. Admin blocked date check
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

      // 3. Conflict check (overnight or 15-min buffer)
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
  console.log("⛔️ Skipping entry due to missing time:", { date, time });
  failedDates.push({ date, reason: "Missing time" });
  continue;
}



      // 4. Time bounds check
      const hour = requestedDate.getHours();
      if (hour < 6 || hour >= 23) {
        failedDates.push({ date, reason: "Outside 6 AM – 11 PM window" });
        continue;
      }

      // ✅ Passed all checks → Create
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
          entries: [{ date, time }],
          notes,
          status: "pending",
          token,
          expiresAt,
        },
      });

      successfulBookings.push(booking);
    }

    // 5. Send email
    if (!successfulBookings.length) {
      return NextResponse.json(
        {
          error: "All selected dates failed validation.",
          failedDates,
        },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const token = successfulBookings[0]?.token;
    const acceptUrl = `${baseUrl}/api/bookings/${token}/accept`;
    const declineUrl = `${baseUrl}/decline/${token}`;

    const emailResult = await resend.emails.send({
      from: "Mabel's Pawfect <no-reply@mabelspawfectpetservices.com>",
      to: "Therainbowniche@gmail.com",
      subject: "New Booking Request",
      html: `
        <h2>🐾 New Booking Request</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Dates Requested:</strong></p>
    <ul>
  ${successfulBookings
    .flatMap((b) =>
      (b.entries || []).map((entry) => {
        const formatted =
          entry?.date && entry?.time
            ? formatDateWithTime(entry.date, entry.time)
            : "Invalid Date";

        return `<li>${formatted}</li>`;
      })
    )
    .join("")}
</ul>




        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Notes:</strong> ${notes || "None"}</p>
        <ul>
          ${pets
            .map(
              (p) => `
            <li>
              <strong>${p.name}</strong> (${p.dob || "DOB not provided"})<br/>
              Vaccinations: ${p.vaccinations || "N/A"}<br/>
              Medical: ${p.medicalConditions || "N/A"}<br/>
              Feeding: ${p.feedingSchedule || "N/A"}<br/>
              Walks: ${p.walkSchedule || "N/A"}<br/>
              Vet: ${p.vetInfo || "N/A"}<br/>
              Notes: ${p.additionalNotes || "None"}
            </li><br/>`
            )
            .join("")}
        </ul>
        <hr />
        <p>
          <a href="${acceptUrl}" style="color:green;font-weight:bold;">✅ Accept Booking</a> |
          <a href="${declineUrl}" style="color:red;font-weight:bold;">❌ Decline Booking</a>
        </p>
      `,
    });

    console.log("📬 Booking email result:", emailResult);

    return NextResponse.json(
      {
        bookings: successfulBookings,
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

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany();
    return NextResponse.json(bookings, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}