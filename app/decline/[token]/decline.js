import { NextResponse } from "next/server";
import { Resend } from "resend";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req, { params }) {
  const { token } = params;
  const { reason } = await req.json();

  try {
    const booking = await prisma.booking.update({
      where: { token },
      data: {
        status: "declined",
        notes: reason,
      },
    });

    // 🔥 Send email to the client
    await resend.emails.send({
      from: "mabel@mabelspawfectpetservices.com",
      to: booking.email, // make sure this exists in your schema!
      subject: "Booking Request Declined",
      html: `
        <h2>Hi ${booking.fullName},</h2>
        <p>Unfortunately, your booking request has been declined.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>We appreciate your interest and hope to connect with you another time.</p>
        <br/>
        <p>Warm wishes,</p>
        <p>🐾 Mabel's Pawfect Team</p>
      `,
    });

    return NextResponse.json({ message: "Declined and email sent." });
  } catch (err) {
    console.error("Decline error:", err);
    return NextResponse.json(
      { error: "Failed to decline booking" },
      { status: 500 }
    );
  }
}