// app/api/bookings/route.js
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import crypto from "crypto";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { fullName, email, phone, address, pets, service, date, notes } =
      await req.json();

    const requestedDate = new Date(date);

    // ⛔️ Block out the whole day for Overnight
    if (service === "Overnight") {
      const startOfDay = new Date(requestedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(requestedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingOvernight = await prisma.booking.findFirst({
        where: {
          status: "accepted",
          service: "Overnight",
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (existingOvernight) {
        return Response.json(
          { error: "An overnight is already booked for this day." },
          { status: 409 }
        );
      }
    } else {
      // 🕒 Buffer check (15 mins before/after)
      const bufferMs = 15 * 60 * 1000;
      const requestedStart = new Date(requestedDate.getTime() - bufferMs);
      const requestedEnd = new Date(requestedDate.getTime() + bufferMs);

      const conflict = await prisma.booking.findFirst({
        where: {
          status: "accepted",
          date: { gte: requestedStart, lte: requestedEnd },
        },
      });

      if (conflict) {
        return Response.json(
          { error: "This time is already booked. Please select another time." },
          { status: 409 }
        );
      }
    }

    // ⏰ Enforce 6am–11pm policy
    const hours = requestedDate.getHours();
    if (hours < 6 || hours >= 23) {
      return Response.json(
        { error: "Bookings must be scheduled between 6:00 AM and 11:00 PM." },
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
        date: requestedDate,
        notes,
        status: "pending",
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
        <p><strong>Date:</strong> ${requestedDate.toLocaleString()}</p>
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

    if (!booking.email) {
      return NextResponse.json(
        { error: "Booking email not found." },
        { status: 400 }
      );
    }

    return Response.json(booking, { status: 201 });
  } catch (err) {
    console.error("POST error:", err);
    return Response.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany();
    return Response.json(bookings, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
