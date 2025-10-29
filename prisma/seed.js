// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  // categories
  const toys = await db.category.upsert({
    where: { slug: "toys" },
    update: {},
    create: { slug: "toys", name: "Toys" },
  });
  const chew = await db.category.upsert({
    where: { slug: "chew" },
    update: {},
    create: { slug: "chew", name: "Chew Toys" },
  });
  const cats = await db.category.upsert({
    where: { slug: "cats" },
    update: {},
    create: { slug: "cats", name: "Cats" },
  });

  // helper — no TS typing
  const upsertProduct = async (slug, data) => {
    const p = await db.product.upsert({
      where: { slug },
      update: {},
      create: { slug, ...data },
    });
    return p;
  };

  // products
  await upsertProduct("rope-tug-chew", {
    title: "Rope Tug Chew",
    subtitle: "Durable cotton blend",
    description: "Great for fetch and tug-of-war. Gentle on gums.",
    priceCents: 1299,
    categories: { connect: [{ id: toys.id }, { id: chew.id }] },
    images: {
      create: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1720000000/rope1.jpg",
          alt: "Rope toy front",
          sort: 0,
        },
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1720000000/rope2.jpg",
          alt: "Rope toy detail",
          sort: 1,
        },
      ],
    },
  });

  await upsertProduct("rubber-bone-classic", {
    title: "Rubber Bone Classic",
    subtitle: "Bouncy & tough",
    description: "Perfect for chewers. Dishwasher safe.",
    priceCents: 999,
    categories: { connect: [{ id: toys.id }, { id: chew.id }] },
    images: {
      create: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1720000000/bone1.jpg",
          alt: "Rubber bone",
          sort: 0,
        },
      ],
    },
  });

  await upsertProduct("feather-wand-cat", {
    title: "Feather Wand (Cat)",
    subtitle: "Interactive play",
    description: "Lightweight wand with replaceable feathers.",
    priceCents: 799,
    categories: { connect: [{ id: toys.id }, { id: cats.id }] },
    images: {
      create: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1720000000/wand1.jpg",
          alt: "Feather wand",
          sort: 0,
        },
      ],
    },
  });

  console.log("Seeded products ✔");
}

main().finally(() => db.$disconnect());
