import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import crypto from "crypto";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { fullName, email, phone, address, pets, service, date, notes } =
        req.body;

      const requestedDate = new Date(date);

      // ⛔️ Block out the whole day for Overnight
      if (service === "Overnight") {
        const startOfDay = new Date(requestedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(requestedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingOvernight = await prisma.booking.findFirst({
          where: {
            status: "accepted",
            service: "Overnight",
            date: { gte: startOfDay, lte: endOfDay },
          },
        });

        if (existingOvernight) {
          return res
            .status(409)
            .json({ error: "An overnight is already booked for this day." });
        }
      } else {
        // 🕒 Buffer check (15 mins before/after)
        const bufferMs = 15 * 60 * 1000;
        const requestedStart = new Date(requestedDate.getTime() - bufferMs);
        const requestedEnd = new Date(requestedDate.getTime() + bufferMs);

        const conflict = await prisma.booking.findFirst({
          where: {
            status: "accepted",
            date: { gte: requestedStart, lte: requestedEnd },
          },
        });

        if (conflict) {
          return res.status(409).json({
            error: "This time is already booked. Please select another time.",
          });
        }
      }

      // ⏰ Enforce 9am–4pm policy
      const hours = requestedDate.getHours();
      if (hours < 9 || hours >= 16) {
        return res
          .status(400)
          .json({
            error: "Bookings must be scheduled between 9:00 AM and 4:00 PM.",
          });
      }

      // 🔐 Create secure token & expiry
      const token = crypto.randomUUID(); // OR use crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hrs

      // ✅ Save booking to DB
      const booking = await prisma.booking.create({
        data: {
          fullName,
          email,
          phone,
          address,
          pets,
          service,
          date: requestedDate,
          notes,
          status: "pending",
          token,
          expiresAt,
        },
      });

      // 📩 Send email with Accept/Decline links
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // configure this in .env
      const acceptUrl = `${baseUrl}/api/bookings/${token}/accept`;
      const declineUrl = `${baseUrl}/decline/${token}`; // this will lead to a page with textarea

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "danielrtorres.dt@gmail.com", // 🔁 Replace with client's real email
        subject: "New Booking Request",
        html: `
          <h2>🐾 New Booking Request</h2>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Date:</strong> ${requestedDate.toLocaleString()}</p>
          <p><strong>Address:</strong> ${address}</p>
          <p><strong>Notes:</strong> ${notes || "None"}</p>
          <ul>
            ${pets
              .map(
                (p) => `
              <li>
                <strong>${p.name}</strong> (${p.dob || "DOB not provided"})<br/>
                Vaccinations: ${p.vaccinations || "N/A"}<br/>
                Medical: ${p.medicalConditions || "N/A"}<br/>
                Feeding: ${p.feedingSchedule || "N/A"}<br/>
                Walks: ${p.walkSchedule || "N/A"}<br/>
                Vet: ${p.vetInfo || "N/A"}<br/>
                Notes: ${p.additionalNotes || "None"}
              </li><br/>`
              )
              .join("")}
          </ul>
          <hr />
          <p>
            <a href="${acceptUrl}" style="color:green;font-weight:bold;">✅ Accept Booking</a> |
            <a href="${declineUrl}" style="color:red;font-weight:bold;">❌ Decline Booking</a>
          </p>
        `,
      });

      return res.status(201).json(booking);
    } catch (err) {
      console.error("POST error:", err);
      return res.status(500).json({ error: "Failed to create booking" });
    }
  }

  // GET all bookings
  if (req.method === "GET") {
    try {
      const bookings = await prisma.booking.findMany();
      return res.status(200).json(bookings);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
