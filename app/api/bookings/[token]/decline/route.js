import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req, { params }) {
  const { token } = params;

  try {
    const body = await req.json();
    const { message } = body;

    const booking = await prisma.booking.findUnique({
      where: { token },
    });

    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "declined") {
      return Response.json(
        { error: "Booking already declined" },
        { status: 400 }
      );
    }

    // Update status to declined
    await prisma.booking.update({
      where: { token },
      data: {
        status: "declined",
      },
    });

    // Send email to client explaining the decline
await resend.emails.send({
  from: "onboarding@resend.dev",
  to: booking.email,
  subject: "Booking Request Declined",
  html: `
    <h2>🐾 Hello ${booking.fullName},</h2>
    <p>Unfortunately, your booking request for <strong>${booking.service}</strong> on <strong>${new Date(
      booking.date
    ).toLocaleString()}</strong> has been declined.</p>
    <p><strong>Reason:</strong></p>
    <blockquote>${message || "No reason was provided."}</blockquote>
    <p>Please feel free to reach out if you'd like to reschedule.</p>
    <p>Thank you for considering us!</p>
  `,
});


    return Response.json({ success: true });
  } catch (error) {
    console.error("DECLINE error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
