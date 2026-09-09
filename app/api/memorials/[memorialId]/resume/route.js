import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  assertMemorialDraftCapability,
  bestEffortTagMemorialForReview,
  isMemorialTransactionConflict,
  MemorialUploadError,
  readBoundedJson,
} from "@/lib/memorialUpload";

export const runtime = "nodejs";

function errorResponse(error) {
  if (error instanceof MemorialUploadError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.code ? { code: error.code } : {}),
      },
      { status: error.status }
    );
  }

  console.error("[memorial-resume] request failed:", {
    message: error?.message,
    code: error?.code,
  });

  return NextResponse.json(
    { error: "The memorial draft could not be restored." },
    { status: 500 }
  );
}

export async function POST(request, context) {
  try {
    const { memorialId } = await context.params;
    const normalizedMemorialId = String(memorialId || "").trim();

    if (!normalizedMemorialId) {
      throw new MemorialUploadError("Missing memorial ID.", 400);
    }

    const body = await readBoundedJson(request, 4 * 1024);
    const draftCapability = String(body?.draftCapability || "");
    let transactionResult;

    try {
      transactionResult = await prisma.$transaction(
        async (transaction) => {
          const memorial = await transaction.petMemorial.findUnique({
            where: { id: normalizedMemorialId },
          });

          assertMemorialDraftCapability(memorial, draftCapability, {
            allowedStatuses: ["DRAFT", "PENDING_PAYMENT"],
          });

          const abandonedReservations =
            await transaction.petMemorialUploadReservation.findMany({
              where: {
                memorialId: normalizedMemorialId,
                state: "PENDING",
              },
              select: {
                id: true,
                publicId: true,
              },
            });

          if (abandonedReservations.length > 0) {
            await transaction.petMemorialUploadReservation.updateMany({
              where: {
                id: { in: abandonedReservations.map(({ id }) => id) },
                state: "PENDING",
              },
              data: {
                state: "REVIEW_REQUIRED",
                reviewRequiredAt: new Date(),
                reviewReason: "BROWSER_SESSION_RESUMED",
              },
            });
          }

          const imageCount = await transaction.petMemorialImage.count({
            where: {
              memorialId: normalizedMemorialId,
              deletedAt: null,
            },
          });

          return {
            memorial,
            imageCount,
            abandonedReservations,
          };
        },
        { isolationLevel: "Serializable" }
      );
    } catch (error) {
      if (isMemorialTransactionConflict(error)) {
        throw new MemorialUploadError(
          "The memorial draft changed while it was being restored. Please retry.",
          409
        );
      }

      throw error;
    }

    for (const reservation of transactionResult.abandonedReservations) {
      await bestEffortTagMemorialForReview(reservation.publicId);
    }

    const { memorial, imageCount } = transactionResult;

    return NextResponse.json(
      {
        memorial: {
          id: memorial.id,
          status: memorial.status,
          ownerName: memorial.ownerName,
          ownerEmail: memorial.ownerEmail,
          ownerPhone: memorial.ownerPhone,
          petName: memorial.petName,
          petType: memorial.petType,
          speciesOther: memorial.speciesOther,
          breed: memorial.breed,
          birthYear: memorial.birthYear,
          passedYear: memorial.passedYear,
          headline: memorial.headline,
          story: memorial.story,
          favoriteThings: memorial.favoriteThings,
          closingMessage: memorial.closingMessage,
          donationAmountCents: memorial.donationAmountCents,
          currency: memorial.currency,
          permissionToPublish: memorial.permissionToPublish,
          permissionToAdvertise: memorial.permissionToAdvertise,
          submitterConfirmedRights: memorial.submitterConfirmedRights,
          expiresAt: memorial.expiresAt,
          draftCapabilityExpiresAt: memorial.draftCapabilityExpiresAt,
          imageCount,
          remainingSlots: Math.max(0, 6 - imageCount),
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
