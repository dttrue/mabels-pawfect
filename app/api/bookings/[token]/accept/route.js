import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  const { token } = params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { token },
    });

    if (!booking) {
      return Response.json({ error: "Booking not found." }, { status: 404 });
    }

    // Check if token is expired
    if (booking.expiresAt && new Date(booking.expiresAt) < new Date()) {
      return Response.json(
        { error: "This link has expired." },
        { status: 410 }
      );
    }

    // Already processed?
    if (booking.status === "accepted" || booking.status === "declined") {
      return Response.json(
        { error: `Booking already ${booking.status}.` },
        { status: 400 }
      );
    }

    // Accept the booking
    await prisma.booking.update({
      where: { token },
      data: { status: "accepted" },
    });

    return Response.json({ message: "Booking accepted successfully." });
  } catch (error) {
    console.error("Accept error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
