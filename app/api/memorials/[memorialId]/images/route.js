import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  assertMemorialDraftCapability,
  bestEffortClearMemorialPendingTag,
  issueMemorialUploadReservation,
  isMemorialTransactionConflict,
  markMemorialReservationForReview,
  MemorialUploadError,
  readBoundedJson,
  verifyMemorialProviderUpload,
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

  console.error("[memorial-images] request failed:", {
    message: error?.message,
    code: error?.code,
  });

  return NextResponse.json(
    { error: "The memorial image request could not be completed." },
    { status: 500 }
  );
}

async function resolveMemorialId(context) {
  const { memorialId } = await context.params;
  const normalized = String(memorialId || "").trim();

  if (!normalized) {
    throw new MemorialUploadError("Missing memorial ID.", 400);
  }

  return normalized;
}

function cleanOptionalText(value, maxLength) {
  const cleaned = String(value || "").trim();

  if (cleaned.length > maxLength) {
    throw new MemorialUploadError("Image text is too long.", 400);
  }

  return cleaned || null;
}

async function loadAuthorizedMemorial(memorialId, draftCapability) {
  const memorial = await prisma.petMemorial.findUnique({
    where: { id: memorialId },
  });

  assertMemorialDraftCapability(memorial, draftCapability, {
    allowedStatuses: ["DRAFT"],
  });

  return memorial;
}

export async function POST(request, context) {
  try {
    const memorialId = await resolveMemorialId(context);
    const body = await readBoundedJson(request, 4 * 1024);
    const draftCapability = String(body?.draftCapability || "");

    const grant = await issueMemorialUploadReservation(
      memorialId,
      draftCapability
    );

    return NextResponse.json(grant, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request, context) {
  let memorialId = null;
  let reservationId = null;

  try {
    memorialId = await resolveMemorialId(context);
    const body = await readBoundedJson(request, 16 * 1024);
    const draftCapability = String(body?.draftCapability || "");
    reservationId = String(body?.reservationId || "").trim();
    const altText = cleanOptionalText(body?.altText, 200);
    const caption = cleanOptionalText(body?.caption, 500);

    if (!reservationId) {
      throw new MemorialUploadError("Missing upload reservation.", 400);
    }

    await loadAuthorizedMemorial(memorialId, draftCapability);

    const reservation =
      await prisma.petMemorialUploadReservation.findUnique({
        where: { id: reservationId },
      });

    if (!reservation || reservation.memorialId !== memorialId) {
      throw new MemorialUploadError("Upload reservation not found.", 404);
    }

    if (reservation.state === "FINALIZED") {
      throw new MemorialUploadError(
        "This upload reservation has already been finalized.",
        409
      );
    }

    if (reservation.state !== "PENDING") {
      throw new MemorialUploadError(
        "This upload reservation requires manual review.",
        409
      );
    }

    if (reservation.finalizationDeadline.getTime() < Date.now()) {
      await markMemorialReservationForReview(
        memorialId,
        reservationId,
        "FINALIZATION_DEADLINE_EXPIRED"
      );

      throw new MemorialUploadError(
        "The image finalization deadline has expired.",
        410
      );
    }

    let authoritativeAsset;

    try {
      authoritativeAsset = await verifyMemorialProviderUpload(
        reservation,
        body?.proof
      );
    } catch (error) {
      if (error instanceof MemorialUploadError && error.markReview) {
        await markMemorialReservationForReview(
          memorialId,
          reservationId,
          error.code || "PROVIDER_VERIFICATION_FAILED"
        );
      }

      throw error;
    }

    let transactionResult;

    try {
      transactionResult = await prisma.$transaction(
        async (transaction) => {
          const transactionMemorial =
            await transaction.petMemorial.findUnique({
              where: { id: memorialId },
            });

          assertMemorialDraftCapability(
            transactionMemorial,
            draftCapability,
            { allowedStatuses: ["DRAFT"] }
          );

          const transactionReservation =
            await transaction.petMemorialUploadReservation.findUnique({
              where: { id: reservationId },
            });

          if (
            !transactionReservation ||
            transactionReservation.memorialId !== memorialId
          ) {
            throw new MemorialUploadError(
              "Upload reservation not found.",
              404
            );
          }

          if (transactionReservation.state === "FINALIZED") {
            throw new MemorialUploadError(
              "This upload reservation has already been finalized.",
              409
            );
          }

          if (transactionReservation.state !== "PENDING") {
            throw new MemorialUploadError(
              "This upload reservation requires manual review.",
              409
            );
          }

          const now = new Date();

          if (transactionReservation.finalizationDeadline < now) {
            throw new MemorialUploadError(
              "The image finalization deadline has expired.",
              410,
              { markReview: true }
            );
          }

          const existingProviderImage =
            await transaction.petMemorialImage.findFirst({
              where: {
                OR: [
                  { publicId: authoritativeAsset.publicId },
                  { assetId: authoritativeAsset.assetId },
                ],
              },
              select: { id: true },
            });

          if (existingProviderImage) {
            throw new MemorialUploadError(
              "This provider asset is already associated with an image.",
              409,
              { markReview: true }
            );
          }

          const activeImageCount = await transaction.petMemorialImage.count({
            where: {
              memorialId,
              deletedAt: null,
            },
          });

          if (activeImageCount >= 6) {
            throw new MemorialUploadError(
              "This memorial already has six finalized photos.",
              409,
              { markReview: true }
            );
          }

          const consumption =
            await transaction.petMemorialUploadReservation.updateMany({
              where: {
                id: reservationId,
                memorialId,
                state: "PENDING",
                finalizationDeadline: { gte: now },
              },
              data: {
                state: "FINALIZED",
                finalizedAt: now,
                providerPublicId: authoritativeAsset.publicId,
                providerAssetId: authoritativeAsset.assetId,
                providerVersion: authoritativeAsset.version,
              },
            });

          if (consumption.count !== 1) {
            throw new MemorialUploadError(
              "This upload reservation is no longer pending.",
              409
            );
          }

          const sortOrderResult =
            await transaction.petMemorialImage.aggregate({
              where: {
                memorialId,
                deletedAt: null,
              },
              _max: { sortOrder: true },
            });

          const image = await transaction.petMemorialImage.create({
            data: {
              memorialId,
              uploadReservationId: reservationId,
              imageUrl: authoritativeAsset.secureUrl,
              publicId: authoritativeAsset.publicId,
              assetId: authoritativeAsset.assetId,
              version: authoritativeAsset.version,
              format: authoritativeAsset.format,
              resourceType: authoritativeAsset.resourceType,
              width: authoritativeAsset.width,
              height: authoritativeAsset.height,
              bytes: authoritativeAsset.bytes,
              altText,
              caption,
              sortOrder: (sortOrderResult._max.sortOrder ?? -1) + 1,
              isCover: activeImageCount === 0,
            },
          });

          return {
            image,
            imageCount: activeImageCount + 1,
          };
        },
        { isolationLevel: "Serializable" }
      );
    } catch (error) {
      if (isMemorialTransactionConflict(error)) {
        throw new MemorialUploadError(
          "Another memorial image request completed first. Please retry.",
          409
        );
      }

      if (error instanceof MemorialUploadError && error.markReview) {
        await markMemorialReservationForReview(
          memorialId,
          reservationId,
          "FINALIZATION_PERSISTENCE_CONFLICT"
        );
      }

      throw error;
    }

    await bestEffortClearMemorialPendingTag(authoritativeAsset.publicId);

    return NextResponse.json(
      {
        image: transactionResult.image,
        imageCount: transactionResult.imageCount,
        remainingSlots: 6 - transactionResult.imageCount,
      },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request, context) {
  try {
    const memorialId = await resolveMemorialId(context);
    const body = await readBoundedJson(request, 4 * 1024);
    const draftCapability = String(body?.draftCapability || "");
    const reservationId = String(body?.reservationId || "").trim();

    if (!reservationId) {
      throw new MemorialUploadError("Missing upload reservation.", 400);
    }

    const memorial = await prisma.petMemorial.findUnique({
      where: { id: memorialId },
    });

    assertMemorialDraftCapability(memorial, draftCapability, {
      allowedStatuses: ["DRAFT", "PENDING_PAYMENT"],
    });

    const result = await markMemorialReservationForReview(
      memorialId,
      reservationId,
      "CLIENT_UPLOAD_ABANDONED"
    );

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
