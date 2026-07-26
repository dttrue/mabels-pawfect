// app/api/admin/memorials/undo/[id]/route.js

import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const UNDO_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req, context) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { params } = await context;
  const id = params?.id;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid memorial ID." },
      { status: 400 }
    );
  }

  const memorial = await prisma.petMemorial.findUnique({
    where: { id },
    select: {
      id: true,
      deletedAt: true,
    },
  });

  if (!memorial) {
    return NextResponse.json({ error: "Memorial not found." }, { status: 404 });
  }

  if (!memorial.deletedAt) {
    return NextResponse.json(
      { error: "Memorial is not deleted." },
      { status: 409 }
    );
  }

  const elapsed = Date.now() - new Date(memorial.deletedAt).getTime();

  if (elapsed > UNDO_WINDOW_MS) {
    return NextResponse.json(
      { error: "The undo period has expired." },
      { status: 410 }
    );
  }

  const restored = await prisma.petMemorial.update({
    where: { id },
    data: {
      deletedAt: null,
    },
  });

  return NextResponse.json({
    success: true,
    restored,
  });
}
