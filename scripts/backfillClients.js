/* scripts/backfillClients.js
   Run: node scripts/backfillClients.js
   Purpose: create Client + Appointment (+ Pet) from existing Booking rows
*/

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function normalizePhone(phone = "") {
  return String(phone).replace(/\D/g, "").trim();
}

function safeLower(s) {
  return (s || "").trim().toLowerCase();
}

// Adjust these if your pets JSON shape differs.
function parsePetsJson(petsJson) {
  if (!petsJson) return [];

  let data = petsJson;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.pets)
      ? data.pets
      : [];

  return arr
    .map((p) => ({
      name: String(p?.name || p?.petName || "").trim(),
      species: String(p?.species || p?.type || p?.petType || "").trim(),
      breed: p?.breed ? String(p.breed).trim() : null,
      age: Number.isFinite(Number(p?.age)) ? Number(p.age) : null,
      notes: p?.notes ? String(p.notes).trim() : null,
    }))
    .filter((p) => p.name.length > 0);
}

// Your Pet model uses `type`, so map "species" -> "type"
function toPetCreateInput(p) {
  return {
    name: p.name,
    species: p.species || "unknown", 
    breed: p.breed,
    age: p.age,
    notes: p.notes,
  };
}


async function main() {
  // ✅ Booking has NO deletedAt field, so don’t filter by it
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${bookings.length} Booking rows`);

  let createdClients = 0;
  let createdAppointments = 0;
  let createdPets = 0;
  let skippedAppointments = 0;

  for (const b of bookings) {
    const email = safeLower(b.email);
    const phoneNorm = normalizePhone(b.phone);
    const key = email || phoneNorm || null;

    if (!key) {
      skippedAppointments++;
      continue;
    }

    // 1) Find or create client
    let client = null;

    if (email) {
      client = await prisma.client.findFirst({
        where: { email, deletedAt: null },
      });
    }

    // Fallback: try phone match (normalized compare)
    if (!client && phoneNorm) {
      const candidates = await prisma.client.findMany({
        where: { phone: { not: null }, deletedAt: null },
      });

      client =
        candidates.find((c) => normalizePhone(c.phone) === phoneNorm) || null;
    }

    if (!client) {
      client = await prisma.client.create({
        data: {
          fullName: b.fullName,
          phone: b.phone || null,
          email: email || null,
          address: b.address || null,
          notes: b.notes || null,
        },
      });
      createdClients++;
    }

    // 2) Idempotency: if Appointment.sourceBookingId exists, use it to prevent duplicates
    // If you DID NOT add sourceBookingId yet, see the "no-migration fallback" below.
    const already = await prisma.appointment.findUnique({
      where: { sourceBookingId: b.id },
    });

    if (already) {
      skippedAppointments++;
      continue;
    }

    // 3) Create appointment from booking
    await prisma.appointment.create({
      data: {
        clientId: client.id,
        service: b.service,
        status: b.status || "pending",
        notes: b.notes || null,
        entries: b.entries || null,
        createdAt: b.createdAt,
        sourceBookingId: b.id,
      },
    });
    createdAppointments++;

    // 4) Create pets (best-effort)
    const parsedPets = parsePetsJson(b.pets);

    for (const p of parsedPets) {
      const existingPet = await prisma.pet.findFirst({
        where: {
          clientId: client.id,
          name: p.name,
          deletedAt: null,
        },
      });

      if (existingPet) continue;

      await prisma.pet.create({
        data: {
          clientId: client.id,
          ...toPetCreateInput(p),
        },
      });

      createdPets++;
    }
  }

  console.log("Backfill complete:");
  console.log({
    createdClients,
    createdAppointments,
    createdPets,
    skippedAppointments,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
