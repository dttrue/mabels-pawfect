// app/api/bookings/[token]/decline/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  createResendClient,
  getRequiredEmailFailure,
  sendRequiredEmail,
} from "@/lib/emails/resend";

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  const { token } = params;
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json(
      { error: "Decline reason is required." },
      { status: 400 }
    );
  }

  try {
    const emailClient = createResendClient();

    const booking = await prisma.booking.update({
      where: { token },
      data: {
        status: "declined",
        notes: message,
      },
      include: { entries: true }, // ✅ Ensure entries are loaded
    });

    await sendRequiredEmail(emailClient, {
      from: "mabel@mabelspawfectpetservices.com",
      to: booking.email,
      subject: "Booking Request Declined",
      html: `
        <h2>Hi ${booking.fullName},</h2>
        <p>Unfortunately, your booking request has been declined.</p>
        <p><strong>Reason:</strong> ${message}</p>
        <p>The following date(s) have been declined:</p>
        <ul>
          ${booking.entries
            .map((entry) => {
              if (!entry?.date || !entry?.time) return "<li>Invalid date</li>";
              const formatted = new Date(
                `${entry.date}T${entry.time}`
              ).toLocaleString();
              return `<li>${formatted}</li>`;
            })
            .join("")}
        </ul>
        <p>We appreciate your interest and hope to connect another time.</p>
        <br/>
        <p>Warm wishes,</p>
        <p>🐾 Mabel's Pawfect Team</p>
      `,
    });

    return NextResponse.json({ message: "Declined and email sent." });
  } catch (err) {
    const emailFailure = getRequiredEmailFailure(err);
    if (emailFailure) {
      return NextResponse.json(
        { error: emailFailure.message },
        { status: emailFailure.status }
      );
    }
    console.error("Decline POST error:", err);
    return NextResponse.json(
      { error: "Failed to decline booking" },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  const { token } = params;

  try {
    const emailClient = createResendClient();

    const booking = await prisma.booking.update({
      where: { token },
      data: {
        status: "declined",
        notes: "Declined via email link",
      },
    });

    if (!booking) {
      console.error("❌ No booking found for token:", token);
      return new Response(
        `<html><body><h2>❌ Booking not found.</h2></body></html>`,
        { headers: { "Content-Type": "text/html" }, status: 404 }
      );
    }

    // 🔥 Send email to the client
    await sendRequiredEmail(emailClient, {
      from: "mabel@mabelspawfectpetservices.com",
      to: booking.email,
      subject: "Booking Declined ❌",
      html: `
        <h2>Hi ${booking.fullName},</h2>
        <p>Your booking has been <strong>declined</strong>.</p>
        <p>We appreciate your interest and hope to connect again in the future.</p>
        <br/>
        <p>🐾 Mabel’s Pawfect Team</p>
      `,
    });

    

    return new Response(
      `<html><body><h2>✅ Booking successfully declined.</h2></body></html>`,
      {
        headers: { "Content-Type": "text/html" },
        status: 200,
      }
    );
  } catch (err) {
    const emailFailure = getRequiredEmailFailure(err);
    if (emailFailure) {
      return new Response(
        `<html><body><h2>⚠️ ${emailFailure.message}</h2></body></html>`,
        {
          headers: { "Content-Type": "text/html" },
          status: emailFailure.status,
        }
      );
    }
    console.error("🔥 Decline GET error:", err);
    return new Response(
      `<html><body><h2>⚠️ Something went wrong while declining this booking. Please contact support.</h2></body></html>`,
      {
        headers: { "Content-Type": "text/html" },
        status: 500,
      }
    );
  }
}







