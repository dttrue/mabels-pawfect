// app/api/admin/shop/images/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* -------------------------------------------- */
/* DELETE — Soft delete an image                */
/* -------------------------------------------- */
export async function DELETE(_req, { params }) {
  const { id } = params || {};
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const image = await prisma.productImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (image.deletedAt) {
      return NextResponse.json({ error: "already_deleted" }, { status: 409 });
    }

    await prisma.productImage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("🛑 DELETE productImage error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/* -------------------------------------------- */
/* PATCH — Update image metadata or set main    */
/* -------------------------------------------- */
export async function PATCH(req, { params }) {
  const { id } = params || {};

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body = {};
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const image = await prisma.productImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { setMain, sort, alt, caption, keywords } = body;

    /* ----------------------------- */
    /* ⭐ SET AS MAIN IMAGE           */
    /* ----------------------------- */
    if (setMain) {
      await prisma.$transaction([
        prisma.productImage.updateMany({
          where: {
            productId: image.productId,
            deletedAt: null,
            NOT: { id },
          },
          data: {
            sort: {
              increment: 1, // push all other images down by 1
            },
          },
        }),
        prisma.productImage.update({
          where: { id },
          data: { sort: 0 }, // this becomes the main image
        }),
      ]);

      return NextResponse.json({ ok: true });
    }

    /* ----------------------------- */
    /* OPTIONAL: metadata updates     */
    /* ----------------------------- */
    const data = {};
    if (typeof sort === "number") data.sort = sort;
    if (typeof alt === "string") data.alt = alt.trim();
    if (typeof caption === "string") data.caption = caption.trim();
    if (Array.isArray(keywords)) data.keywords = keywords;

    const updated = await prisma.productImage.update({
      where: { id },
      data,
    });

    return NextResponse.json({ image: updated });
  } catch (err) {
    console.error("🛑 PATCH productImage error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
