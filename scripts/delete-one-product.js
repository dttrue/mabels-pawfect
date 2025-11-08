// scripts/delete-one-product.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const slug = "the-durable-dog-batton-xl-chew-toy-for-dogs"; // change to the product you want
    const product = await prisma.product.findUnique({ where: { slug } });

    if (!product) {
      console.log("❌ Product not found");
      return;
    }

    await prisma.product.delete({ where: { id: product.id } });
    console.log(`✅ Deleted product "${product.title}"`);
  } catch (err) {
    console.error("Delete failed:", err);
  } finally {
    await prisma.$disconnect();
  }
})();
