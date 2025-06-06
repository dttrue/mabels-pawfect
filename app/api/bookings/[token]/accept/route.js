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
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    if (booking.expiresAt && new Date(booking.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This link has expired." },
        { status: 410 }
      );
    }

    if (booking.status === "accepted" || booking.status === "declined") {
      return NextResponse.json(
        { error: `Booking already ${booking.status}.` },
        { status: 400 }
      );
    }

    // ✅ Update booking
    await prisma.booking.update({
      where: { token },
      data: { status: "accepted" },
    });

    // ✅ Email confirmation to client
    await resend.emails.send({
      from: "mabel@mabelspawfectpetservices.com",
      to: booking.email,
      subject: "Booking Confirmed ✅",
      html: `
        <h2>Hi ${booking.fullName},</h2>
        <p>Your booking request has been <strong>accepted</strong>!</p>
        <p>We’re looking forward to seeing you on <strong>${new Date(
          booking.date
        ).toLocaleString()}</strong>.</p>
        <br/>
        <p>Thank you for choosing Mabel's Pawfect!</p>
        <p>🐾 The Mabel’s Pawfect Team</p>
      `,
    });

    return NextResponse.json({
      message: "Booking accepted and confirmation email sent.",
    });
  } catch (err) {
    console.error("Accept error:", err);
    return NextResponse.json(
      { error: "Failed to accept booking" },
      { status: 500 }
    );
  }
}
