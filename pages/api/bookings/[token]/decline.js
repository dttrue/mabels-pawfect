import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";


const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  const { token } = req.query;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { token },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status === "declined") {
      return res.status(400).json({ error: "Booking already declined" });
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
      to: booking.phone.includes("@") ? booking.phone : "danielrtorres.dt@gmail.com", // 📌 Replace with actual client email field
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("DECLINE error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
