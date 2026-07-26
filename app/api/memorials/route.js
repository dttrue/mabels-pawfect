// app/api/memorials/route.js

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_PET_TYPES = new Set([
  "DOG",
  "CAT",
  "BIRD",
  "RABBIT",
  "REPTILE",
  "OTHER",
]);

function cleanOptionalString(value) {
  const cleaned = String(value || "").trim();
  return cleaned || null;
}

function parseOptionalYear(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const year = Number(value);
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
    return null;
  }

  return year;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const ownerName = String(body.ownerName || "").trim();

    const ownerEmail = String(body.ownerEmail || "")
      .trim()
      .toLowerCase();

    const petName = String(body.petName || "").trim();
    const story = String(body.story || "").trim();

    const permissionToPublish = body.permissionToPublish === true;
    const permissionToAdvertise = body.permissionToAdvertise === true;

    const submitterConfirmedRights = body.submitterConfirmedRights === true;

    const donationAmountCents = Number(body.donationAmountCents);

    const requestedPetType = String(body.petType || "")
      .trim()
      .toUpperCase();

    const petType = ALLOWED_PET_TYPES.has(requestedPetType)
      ? requestedPetType
      : null;

    const birthYear = parseOptionalYear(body.birthYear);
    const passedYear = parseOptionalYear(body.passedYear);

    if (!ownerName) {
      return NextResponse.json(
        {
          error: "Your name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!ownerEmail || !EMAIL_PATTERN.test(ownerEmail)) {
      return NextResponse.json(
        {
          error: "A valid email address is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!petName) {
      return NextResponse.json(
        {
          error: "Your pet's name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!petType) {
      return NextResponse.json(
        {
          error: "Please select a valid pet type.",
        },
        {
          status: 400,
        }
      );
    }

    if (petType === "OTHER" && !cleanOptionalString(body.speciesOther)) {
      return NextResponse.json(
        {
          error: "Please tell us what type of pet you are memorializing.",
        },
        {
          status: 400,
        }
      );
    }

    if (story.length < 20) {
      return NextResponse.json(
        {
          error: "Please share at least a few sentences about your pet.",
        },
        {
          status: 400,
        }
      );
    }

    if (story.length > 5000) {
      return NextResponse.json(
        {
          error: "The memorial story cannot exceed 5,000 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (birthYear !== null && passedYear !== null && passedYear < birthYear) {
      return NextResponse.json(
        {
          error: "The year of passing cannot be earlier than the birth year.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(donationAmountCents) ||
      donationAmountCents < 300 ||
      donationAmountCents > 1000000
    ) {
      return NextResponse.json(
        {
          error: "The memorial donation must be at least $3.",
        },
        {
          status: 400,
        }
      );
    }

    if (!permissionToPublish) {
      return NextResponse.json(
        {
          error:
            "Permission to publish is required to create a public memorial.",
        },
        {
          status: 400,
        }
      );
    }

    if (!submitterConfirmedRights) {
      return NextResponse.json(
        {
          error:
            "You must confirm that you have permission to submit the photos and story.",
        },
        {
          status: 400,
        }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const memorial = await prisma.petMemorial.create({
      data: {
        status: "DRAFT",

        ownerName,
        ownerEmail,
        ownerPhone: cleanOptionalString(body.ownerPhone),

        petName,
        petType,
        speciesOther:
          petType === "OTHER" ? cleanOptionalString(body.speciesOther) : null,
        breed: cleanOptionalString(body.breed),

        birthYear,
        passedYear,

        headline: cleanOptionalString(body.headline),
        story,
        favoriteThings: cleanOptionalString(body.favoriteThings),
        closingMessage: cleanOptionalString(body.closingMessage),

        donationAmountCents,
        currency: "usd",

        permissionToPublish,
        permissionToAdvertise,
        submitterConfirmedRights,

        expiresAt,
      },
      select: {
        id: true,
        status: true,
        donationAmountCents: true,
        currency: true,
        expiresAt: true,
      },
    });

    return NextResponse.json(
      {
        memorial,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("[memorials] create error:", error);

    return NextResponse.json(
      {
        error: "We could not create the memorial submission. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
