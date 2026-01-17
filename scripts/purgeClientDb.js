// scripts/purgeClientDb.js
// Run: node scripts/purgeClientDb.js
// ⚠️ DANGER: This deletes data from the NEW client DB tables.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Basic safety guard — prevents accidental run on production URLs
  const dbUrl = process.env.DATABASE_URL || "";
  const looksProd = /neon|render|supabase|railway|aws|gcp|azure|prod/i.test(
    dbUrl
  );
  const force = process.env.FORCE_DB_PURGE === "true";

  if (looksProd && !force) {
    console.error("Refusing to run: DATABASE_URL looks like production.");
    console.error("If this is intentional, run with FORCE_DB_PURGE=true");
    process.exit(1);
  }


  console.log("Purging new tables: Payment -> Appointment -> Pet -> Client");

  const payments = await prisma.payment.deleteMany({});
  const appointments = await prisma.appointment.deleteMany({});
  const pets = await prisma.pet.deleteMany({});
  const clients = await prisma.client.deleteMany({});

  console.log("Done:");
  console.log({
    paymentsDeleted: payments.count,
    appointmentsDeleted: appointments.count,
    petsDeleted: pets.count,
    clientsDeleted: clients.count,
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
