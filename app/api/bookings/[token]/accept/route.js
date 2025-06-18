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

    const formattedDates = booking.entries
      .map((entry) => {
        if (!entry?.date || !entry?.time) return "<li>Invalid date</li>";
        return `<li>${new Date(`${entry.date}T${entry.time}`).toLocaleString()}</li>`;
      })
      .join("");

    await resend.emails.send({
      from: "mabel@mabelspawfectpetservices.com",
      to: booking.email,
      subject: "Booking Confirmed ✅",
      html: `
        <h2>Hi ${booking.fullName},</h2>
        <p>Your booking has been <strong>accepted</strong>!</p>
        <p>See you on:</p>
        <ul>${formattedDates}</ul>
        <p>🐾 Mabel’s Pawfect Team</p>
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


