import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.contest.upsert({
    where: { slug: "halloween-2025" },
    update: {},
    create: { slug: "halloween-2025", title: "Halloween 2025" },
  });
  console.log("✅ Seeded contest halloween-2025");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
