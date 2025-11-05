const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    console.log("Deleting all products (cascades will clean children)…");
    await prisma.product.deleteMany({}); // images/variants/inventory/cartItems + M2M rows drop via cascade
    console.log("✅ Done.");
  } catch (e) {
    console.error("❌ Delete failed:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
