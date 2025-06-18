// app/api/bookings/[token]/accept/route.js
// app/api/bookings/[token]/accept/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req, { params }) {
  const { token } = params;
  console.log("📥 Accept GET called with token:", token);

  try {
    const booking = await prisma.booking.findUnique({
      where: { token },
    });

    if (!booking) {
      console.error("❌ Booking not found for token:", token);
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const firstEntry = booking.entries?.[0];
    const readableDate =
      firstEntry?.date && firstEntry?.time
        ? new Date(`${firstEntry.date}T${firstEntry.time}`).toLocaleString()
        : "Unknown date";

    console.log("📅 First entry readable date:", readableDate);

    if (booking.expiresAt && new Date(booking.expiresAt) < new Date()) {
      console.warn("⏰ Booking link expired.");
      return NextResponse.json({ error: "This link has expired." }, { status: 410 });
    }

    if (booking.status === "accepted" || booking.status === "declined") {
      console.warn(`⚠️ Booking already ${booking.status}.`);
      return NextResponse.json(
        { error: `Booking already ${booking.status}.` },
        { status: 400 }
      );
    }

    await prisma.booking.update({
      where: { token },
      data: { status: "accepted" },
    });

    console.log("✅ Booking marked as accepted in database.");
    
    console.log(
      "🧾 Raw booking.entries:",
      JSON.stringify(booking.entries, null, 2)
    );

    const formattedDates = (booking.entries || [])
      .map((entry, i) => {
        console.log(`📅 Entry ${i}:`, entry); // Log each individual entry

        const { date, time } = entry || {};
        if (!date || !time) return "<li>⚠️ Missing date or time</li>";

        const iso = `${date}T${time}`;
        const readable = new Date(iso).toLocaleString();

        return `<li>${readable}</li>`;
      })
      .join("");

    // Email
    await resend.emails.send({
      from: "mabel@mabelspawfectpetservices.com",
      to: booking.email,
      subject: "Booking Confirmed ✅",
      html: `
    <h2>Hi ${booking.fullName},</h2>
    <p>Your booking was ${
      booking.status === "declined" ? "declined" : "accepted"
    }.</p>
    <p>Scheduled Date(s):</p>
    <ul>${formattedDates}</ul>
    <p>Thank you for choosing Mabel’s Pawfect!</p>
    <p>🐾 The Mabel’s Pawfect Team</p>
  `,
    });

    console.log("📧 Confirmation email sent to:", booking.email);

    return NextResponse.json({
      message: "Booking accepted and confirmation email sent.",
    });
  } catch (err) {
    console.error("❌ Accept error:", err);
    return NextResponse.json(
      { error: "Failed to accept booking" },
      { status: 500 }
    );
  }
}


