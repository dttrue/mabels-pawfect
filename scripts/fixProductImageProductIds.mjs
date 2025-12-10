// scripts/fixProductImageProductIds.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const images = await prisma.productImage.findMany();
  console.log(`Found ${images.length} ProductImage rows`);

  for (const img of images) {
    if (!img.productId) continue;

    // If it's already a full proper id, skip it
    if (img.productId.length >= 24 && img.productId.startsWith("cmi")) {
      continue;
    }

    // Try to find a product whose id contains this (short) productId
    const product = await prisma.product.findFirst({
      where: { id: { contains: img.productId } },
    });

    if (!product) {
      console.warn(
        `⚠️  No product match for ProductImage ${img.id} productId=${img.productId}`
      );
      continue;
    }

    if (product.id === img.productId) continue;

    console.log(
      `Fixing ProductImage ${img.id}: ${img.productId} -> ${product.id}`
    );

    await prisma.productImage.update({
      where: { id: img.id },
      data: { productId: product.id },
    });
  }

  console.log("✅ Done fixing ProductImage.productId values");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
