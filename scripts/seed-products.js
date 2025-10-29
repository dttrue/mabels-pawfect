// scripts/seed-products.js  (CommonJS)
const path = require("node:path");
const fs = require("node:fs");
const cloudinary = require("cloudinary").v2;
const { PrismaClient } = require("@prisma/client");
const { CATEGORIES, PRODUCTS } = require("./products.data.js");

const db = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function cdnFolderFor(slug) {
  return `mabels/shop/${slug}`;
}

async function ensureCategories() {
  for (const c of CATEGORIES) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
}

async function uploadImage(localFile, folder, slug, ix) {
  const absolute = path.join(
    __dirname,
    "..",
    "public",
    "shop-images",
    localFile
  );
  if (!fs.existsSync(absolute)) {
    console.warn(`⚠️  Missing file: ${absolute} — skipping upload`);
    return null;
  }
  const res = await cloudinary.uploader.upload(absolute, {
    folder,
    public_id: `${slug}-${ix + 1}`,
    overwrite: true,
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
  return { url: res.secure_url };
}

async function upsertProduct(p) {
  const categoryConnections = {
    connect: (p.categories || []).map((slug) => ({ slug })),
  };

  const product = await db.product.upsert({
    where: { slug: p.slug },
    update: {
      title: p.title,
      subtitle: p.subtitle ?? null,
      description: p.description ?? null,
      priceCents: p.priceCents,
      active: true,
      categories: categoryConnections,
      updatedAt: new Date(),
    },
    create: {
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle ?? null,
      description: p.description ?? null,
      priceCents: p.priceCents,
      active: true,
      categories: categoryConnections,
    },
  });

  // images optional
  const folder = cdnFolderFor(p.slug);
  const uploads = [];
  for (let i = 0; i < (p.images || []).length; i++) {
    const up = await uploadImage(p.images[i], folder, p.slug, i);
    if (up) uploads.push(up);
  }

  if (uploads.length) {
    await db.productImage.deleteMany({ where: { productId: product.id } });
    for (let i = 0; i < uploads.length; i++) {
      await db.productImage.create({
        data: {
          productId: product.id,
          url: uploads[i].url,
          alt: `${p.title} ${i + 1}`,
          sort: i,
        },
      });
    }
  }

  return product;
}

async function main() {
  console.log("→ Seeding categories…");
  await ensureCategories();

  for (const p of PRODUCTS) {
    console.log(`→ Seeding product: ${p.slug}`);
    await upsertProduct(p);
  }

  console.log("✔ Done seeding products & images.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
