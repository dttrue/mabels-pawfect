// app/api/memorials/checkout/route.js

export const runtime = "nodejs";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import memorialStripe from "@/lib/memorialStripe";

function getBaseUrlFromEnvironment() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

async function resolveBaseUrl() {
  let baseUrl = getBaseUrlFromEnvironment();

  try {
    const headerStore = await headers();
    const host = headerStore.get("host");

    if (host) {
      const forwardedProto = headerStore.get("x-forwarded-proto");
      const protocol =
        forwardedProto || (host.includes("localhost") ? "http" : "https");

      baseUrl = `${protocol}://${host}`.replace(/\/+$/, "");
    }
  } catch (error) {
    console.warn("[memorial-checkout] Could not resolve request host:", error);
  }

  return baseUrl;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const memorialId = String(body?.memorialId || "").trim();

    if (!memorialId) {
      return NextResponse.json(
        {
          error: "Missing memorial ID.",
        },
        {
          status: 400,
        }
      );
    }

    const memorial = await prisma.petMemorial.findUnique({
      where: {
        id: memorialId,
      },
      include: {
        images: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            imageUrl: true,
            isCover: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!memorial || memorial.deletedAt) {
      return NextResponse.json(
        {
          error: "Memorial submission not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!["DRAFT", "PENDING_PAYMENT"].includes(memorial.status)) {
      return NextResponse.json(
        {
          error: "This memorial is not available for checkout.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !Number.isInteger(memorial.donationAmountCents) ||
      memorial.donationAmountCents < 300
    ) {
      return NextResponse.json(
        {
          error: "This memorial does not have a valid donation amount.",
        },
        {
          status: 400,
        }
      );
    }

    if (memorial.images.length === 0) {
      return NextResponse.json(
        {
          error: "Please upload at least one memorial photo before checkout.",
        },
        {
          status: 400,
        }
      );
    }

    const baseUrl = await resolveBaseUrl();

    const coverImage =
      memorial.images.find((image) => image.isCover) || memorial.images[0];

    const productData = {
      name: `${memorial.petName} Memorial`,
      description:
        "A personalized online memorial page containing the pet's photos, story, and tribute.",
      tax_code: process.env.MEMORIAL_STRIPE_TAX_CODE,
      metadata: {
        memorialId: memorial.id,
        paymentType: "memorial",
      },
    };

    if (coverImage?.imageUrl) {
      productData.images = [coverImage.imageUrl];
    }

    const session = await memorialStripe.checkout.sessions.create({
      mode: "payment",

      customer_email: memorial.ownerEmail,

      line_items: [
        {
          price_data: {
            currency: memorial.currency || "usd",
            unit_amount: memorial.donationAmountCents,
            product_data: {
              name: `${memorial.petName} Memorial`,
              description:
                "A personalized online pet memorial page containing the pet's photos, story, and tribute.",
              tax_code: "txcd_10701401",
            },
          },
          quantity: 1,
        },
      ],

      metadata: {
        paymentType: "memorial",
        memorialId: memorial.id,
      },

      payment_intent_data: {
        metadata: {
          paymentType: "memorial",
          memorialId: memorial.id,
        },
      },

      success_url: `${baseUrl}/memorials/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/memorials/create?memorialId=${encodeURIComponent(
        memorial.id
      )}&checkout=canceled`,
    });

    await prisma.petMemorial.update({
      where: {
        id: memorial.id,
      },
      data: {
        status: "PENDING_PAYMENT",
        stripeSessionId: session.id,
      },
    });

    return NextResponse.json(
      {
        url: session.url,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("[memorial-checkout] Failed to create Checkout Session:", {
      type: error?.type,
      code: error?.code,
      message: error?.message,
      param: error?.param,
      statusCode: error?.statusCode,
    });

    return NextResponse.json(
      {
        error: "We could not start memorial checkout. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
