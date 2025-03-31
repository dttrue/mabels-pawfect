import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { token } = req.query;

  try {
    const booking = await prisma.booking.findUnique({
      where: { token },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    // Check if token is expired
    if (booking.expiresAt && new Date(booking.expiresAt) < new Date()) {
      return res.status(410).json({ error: "This link has expired." });
    }

    // Already processed?
    if (booking.status === "accepted" || booking.status === "declined") {
      return res
        .status(400)
        .json({ error: `Booking already ${booking.status}.` });
    }

    // Accept the booking
    await prisma.booking.update({
      where: { token },
      data: { status: "accepted" },
    });

    return res.status(200).json({ message: "Booking accepted successfully." });
  } catch (error) {
    console.error("Accept error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
