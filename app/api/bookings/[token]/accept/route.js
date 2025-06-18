// app/api/bookings/[token]/accept/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req, { params }) {
  const { token } = params;

  console.log("✅ Accept triggered via email link for token:", token);

  try {
    const booking = await prisma.booking.findUnique({
      where: { token },
    });

    if (!booking) {
      console.warn("⛔️ Booking not found for token:", token);
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    if (booking.expiresAt && new Date(booking.expiresAt) < new Date()) {
      console.warn("⏰ Booking link expired for token:", token);
      return NextResponse.json(
        { error: "This link has expired." },
        { status: 410 }
      );
    }

    if (booking.status === "accepted" || booking.status === "declined") {
      console.warn(`⚠️ Booking already ${booking.status} for token:`, token);
      return NextResponse.json(
        { error: `Booking already ${booking.status}.` },
        { status: 400 }
      );
    }

    // ✅ Update status
    await prisma.booking.update({
      where: { token },
      data: { status: "accepted" },
    });

    const acceptedDates =
      Array.isArray(booking.entries) && booking.entries.length > 0
        ? booking.entries
            .map((entry) => {
              if (!entry?.date || !entry?.time) return "<li>Invalid date</li>";
              const formatted = new Date(
                `${entry.date}T${entry.time}`
              ).toLocaleString();
              return `<li>${formatted}</li>`;
            })
            .join("")
        : "<li>No valid booking dates found</li>";

    console.log("📅 Accepted Dates HTML:", acceptedDates);

    await resend.emails.send({
      from: "mabel@mabelspawfectpetservices.com",
      to: booking.email,
      subject: "Booking Confirmed ✅",
      html: `
        <h2>Hi ${booking.fullName},</h2>
        <p>Your booking request has been <strong>accepted</strong>!</p>
        <p>We’re looking forward to seeing you on the following date(s):</p>
        <ul>${acceptedDates}</ul>
        <br/>
        <p>Thank you for choosing Mabel's Pawfect!</p>
        <p>🐾 The Mabel’s Pawfect Team</p>
      `,
    });

    console.log("📨 Accept email sent to:", booking.email);

    return NextResponse.json({
      message: "Booking accepted and confirmation email sent.",
    });
  } catch (err) {
    console.error("❌ Accept GET error:", err);
    return NextResponse.json(
      { error: "Failed to accept booking" },
      { status: 500 }
    );
  }
}
