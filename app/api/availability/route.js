// app/api/availability/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";



export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Missing start or end date in query." },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const bookings = await prisma.booking.findMany({
      where: {
        status: "accepted",
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        service: true,
      },
    });

    // 🧠 Group bookings by day
    const availabilityMap = {};

    for (const booking of bookings) {
      const dateKey = booking.date.toISOString().split("T")[0];

      if (!availabilityMap[dateKey]) {
        availabilityMap[dateKey] = {
          date: dateKey,
          slots: [],
          isFullyBooked: false,
        };
      }

      if (booking.service === "Overnight") {
        availabilityMap[dateKey].isFullyBooked = true;
        availabilityMap[dateKey].slots.push("Overnight");
      } else {
        const timeStr = booking.date.toTimeString().split(" ")[0].slice(0, 5);
        availabilityMap[dateKey].slots.push(timeStr);
      }
    }

    // ⛔️ Handle manually blocked days
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 👇 After booking loop, insert or merge blocked dates
    blockedDates.forEach((blocked) => {
      const raw = new Date(blocked.date);
      raw.setHours(0, 0, 0, 0); // normalize
      const key = raw.toISOString().split("T")[0];

      // Merge or create
      availabilityMap[key] = {
        ...(availabilityMap[key] || {}),
        date: key,
        slots: [],
        isFullyBooked: true,
        blockedByAdmin: true,
      };
    });

    const response = Object.values(availabilityMap);
    return NextResponse.json(response);
  } catch (err) {
    console.error("Error fetching availability:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
