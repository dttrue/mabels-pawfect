// app/api/admin/memorials/[id]/route.js

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function DELETE(req, context) {
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

  try {
    const memorial = await prisma.petMemorial.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      memorial,
    });
  } catch (error) {
    console.error("[DELETE_MEMORIAL_ERROR]", {
      id,
      error,
    });

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete memorial." },
      { status: 500 }
    );
  }
}
