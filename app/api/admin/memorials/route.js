// app/api/admin/memorials/route.js

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const memorials = await prisma.petMemorial.findMany({
      where: {
        deletedAt: null,
        status: {
          in: ["PAID", "PUBLISHED", "REJECTED"],
        },
      },
      select: {
        id: true,
        slug: true,
        ownerName: true,
        ownerEmail: true,
        ownerPhone: true,
        petName: true,
        petType: true,
        breed: true,
        birthYear: true,
        passedYear: true,
        headline: true,
        story: true,
        favoriteThings: true,
        closingMessage: true,
        donationAmountCents: true,
        currency: true,
        status: true,
        paidAt: true,
        publishedAt: true,
        reviewedAt: true,
        createdAt: true,
        images: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            imageUrl: true,
            publicId: true,
            altText: true,
            caption: true,
            isCover: true,
            sortOrder: true,
            createdAt: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(memorials);
  } catch (error) {
    console.error("[ADMIN_MEMORIALS_GET_ERROR]", error);

    return NextResponse.json(
      {
        error: "Failed to load memorial submissions.",
      },
      {
        status: 500,
      }
    );
  }
}
