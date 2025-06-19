// app/api/bookings/[token]/accept/route.js

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req, { params }) {
  const { token } = params;
  

  try {
    const booking = await prisma.booking.findUnique({
      where: { token },
    });

    if (!booking) {
      console.error("❌ Booking not found for token:", token);
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    if (booking.expiresAt && new Date(booking.expiresAt) < new Date()) {
      console.warn("⏰ Booking link expired.");
      return NextResponse.json(
        { error: "This link has expired." },
        { status: 410 }
      );
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
        if (!entry?.date || !entry?.time)
          return `<li>⚠️ Invalid date for entry ${i}</li>`;
        const formatted = new Date(
          `${entry.date}T${entry.time}`
        ).toLocaleString();
        return `<li>${formatted}</li>`;
      })
      .join("");

    await resend.emails.send({
      from: "mabel@mabelspawfectpetservices.com",
      to: booking.email,
      subject: "Booking Confirmed ✅",
      html: `
        <h2>Hi ${booking.fullName},</h2>
        <p>Your booking has been <strong>accepted</strong>!</p>
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



