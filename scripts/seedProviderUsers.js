// scripts/seedProviderUsers.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


async function main() {
  await prisma.providerUser.createMany({
    data: [
      {
        name: "Daniel Torres",
        email: "dttrue511@gmail.com",
        clerkId: "user_2xYcBxcVUeYD9RmUOhCdEErW4ef",
      },
      {
        name: "Bridget Quinones",
        email: "therainbowniche@gmail.com",
        clerkId: "user_2xbPOkF9DIJJQFVuQk0QbjBw5bC",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Seeded ProviderUsers");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

