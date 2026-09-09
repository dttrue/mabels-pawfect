// app/api/bookings/[token]/accept/route.js

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  createResendClient,
  getRequiredEmailFailure,
  sendRequiredEmail,
} from "@/lib/emails/resend";

const prisma = new PrismaClient();

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

    const emailClient = createResendClient();

    await prisma.booking.update({
      where: { token },
      data: { status: "accepted" },
    });

    console.log("✅ Booking marked as accepted in database.");
    await sendRequiredEmail(emailClient, {
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

  

    return NextResponse.json({
      message: "Booking accepted and confirmation email sent.",
    });
  } catch (err) {
    const emailFailure = getRequiredEmailFailure(err);
    if (emailFailure) {
      return NextResponse.json(
        { error: emailFailure.message },
        { status: emailFailure.status }
      );
    }
    console.error("❌ Accept error:", err);
    return NextResponse.json(
      { error: "Failed to accept booking" },
      { status: 500 }
    );
  }
}


