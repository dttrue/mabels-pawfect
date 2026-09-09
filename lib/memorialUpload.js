import "server-only";

import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";

export const MEMORIAL_UPLOAD_POLICY = Object.freeze({
  purpose: "public-memorial-image",
  preset: "mabels-memorial-public-uploads",
  resourceType: "image",
  deliveryType: "upload",
  folder: "mabels-pawfect/memorials/public",
  maxBytes: 10 * 1024 * 1024,
  maxDimension: 2400,
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  transformation: "c_limit,w_2400,h_2400,q_auto:good",
  uploadTtlSeconds: 10 * 60,
  finalizationGraceSeconds: 5 * 60,
  manualReviewDelaySeconds: 15 * 60,
});

const CAPABILITY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_IMAGES = 6;
const MAX_RESERVATION_RETRIES = 3;
const MAX_LIFETIME_RESERVATIONS = MAX_IMAGES + MAX_RESERVATION_RETRIES;
const CLOCK_SKEW_SECONDS = 30;
const PENDING_TAG = "mabels-memorial-pending";
const REVIEW_TAG = "mabels-memorial-review-required";

export class MemorialUploadError extends Error {
  constructor(message, status = 400, options = {}) {
    super(message);
    this.name = "MemorialUploadError";
    this.status = status;
    this.code = options.code || null;
    this.markReview = options.markReview === true;
  }
}

export async function readBoundedJson(request, maxBytes = 32 * 1024) {
  const declaredLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new MemorialUploadError("Request body is too large.", 413);
  }

  if (!request.body) {
    throw new MemorialUploadError("Invalid JSON.", 400);
  }

  const reader = request.body.getReader();
  const chunks = [];
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      bytesRead += value.byteLength;

      if (bytesRead > maxBytes) {
        await reader.cancel();
        throw new MemorialUploadError("Request body is too large.", 413);
      }

      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(Buffer.concat(chunks, bytesRead).toString("utf8"));
  } catch {
    throw new MemorialUploadError("Invalid JSON.", 400);
  }
}

function capabilityHash(capability) {
  return createHash("sha256").update(capability, "utf8").digest("hex");
}

export function createMemorialDraftCapability() {
  const capability = randomBytes(32).toString("base64url");

  return {
    capability,
    hash: capabilityHash(capability),
  };
}

function secureEquals(left, right) {
  if (typeof left !== "string" || typeof right !== "string") {
    return false;
  }

  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function assertMemorialDraftCapability(
  memorial,
  capability,
  { allowedStatuses = ["DRAFT"] } = {}
) {
  if (!memorial || memorial.deletedAt) {
    throw new MemorialUploadError("Memorial submission not found.", 404);
  }

  if (!memorial.draftCapabilityHash || !memorial.draftCapabilityExpiresAt) {
    throw new MemorialUploadError(
      "This draft predates secure memorial access and cannot use the public upload flow.",
      409,
      { code: "LEGACY_DRAFT_WITHOUT_CAPABILITY" }
    );
  }

  if (
    typeof capability !== "string" ||
    !CAPABILITY_PATTERN.test(capability) ||
    !secureEquals(capabilityHash(capability), memorial.draftCapabilityHash)
  ) {
    throw new MemorialUploadError("Draft access could not be verified.", 403);
  }

  if (memorial.draftCapabilityInvalidatedAt) {
    throw new MemorialUploadError("Draft access is no longer active.", 410);
  }

  if (memorial.draftCapabilityExpiresAt.getTime() < Date.now()) {
    throw new MemorialUploadError("Draft access has expired.", 410);
  }

  if (!allowedStatuses.includes(memorial.status)) {
    throw new MemorialUploadError(
      "This memorial is no longer eligible for draft access.",
      409
    );
  }
}

function getCloudinaryConfiguration() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new MemorialUploadError(
      "Memorial image uploads are not configured.",
      500
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return { cloudName, apiKey, apiSecret };
}

function contextForReservation(reservation) {
  return [
    `memorial_upload_purpose=${MEMORIAL_UPLOAD_POLICY.purpose}`,
    `reservation_nonce=${reservation.nonce}`,
    `upload_expires=${Math.floor(reservation.uploadDeadline.getTime() / 1000)}`,
    `finalize_expires=${Math.floor(
      reservation.finalizationDeadline.getTime() / 1000
    )}`,
    `max_bytes=${MEMORIAL_UPLOAD_POLICY.maxBytes}`,
  ].join("|");
}

function uploadParamsForReservation(reservation) {
  return {
    timestamp: Math.floor(reservation.createdAt.getTime() / 1000),
    upload_preset: MEMORIAL_UPLOAD_POLICY.preset,
    folder: MEMORIAL_UPLOAD_POLICY.folder,
    public_id: reservation.publicId,
    overwrite: "false",
    unique_filename: "false",
    use_filename: "false",
    allowed_formats: MEMORIAL_UPLOAD_POLICY.allowedFormats.join(","),
    transformation: MEMORIAL_UPLOAD_POLICY.transformation,
    context: contextForReservation(reservation),
    tags: `${PENDING_TAG},${MEMORIAL_UPLOAD_POLICY.purpose}`,
    type: MEMORIAL_UPLOAD_POLICY.deliveryType,
  };
}

function isSerializableConflict(error) {
  return error?.code === "P2034";
}

export async function bestEffortTagMemorialForReview(publicId) {
  if (!publicId) {
    return false;
  }

  try {
    getCloudinaryConfiguration();
    await cloudinary.uploader.add_tag(REVIEW_TAG, [publicId], {
      resource_type: MEMORIAL_UPLOAD_POLICY.resourceType,
      type: MEMORIAL_UPLOAD_POLICY.deliveryType,
    });
    return true;
  } catch {
    return false;
  }
}

export async function bestEffortClearMemorialPendingTag(publicId) {
  if (!publicId) {
    return false;
  }

  try {
    getCloudinaryConfiguration();
    await cloudinary.uploader.remove_tag(PENDING_TAG, [publicId], {
      resource_type: MEMORIAL_UPLOAD_POLICY.resourceType,
      type: MEMORIAL_UPLOAD_POLICY.deliveryType,
    });
    return true;
  } catch {
    return false;
  }
}

export async function issueMemorialUploadReservation(
  memorialId,
  capability
) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfiguration();
  const now = new Date();
  const uploadDeadline = new Date(
    now.getTime() + MEMORIAL_UPLOAD_POLICY.uploadTtlSeconds * 1000
  );
  const finalizationDeadline = new Date(
    uploadDeadline.getTime() +
      MEMORIAL_UPLOAD_POLICY.finalizationGraceSeconds * 1000
  );
  const reviewAfter = new Date(
    finalizationDeadline.getTime() +
      MEMORIAL_UPLOAD_POLICY.manualReviewDelaySeconds * 1000
  );

  let transactionResult;

  try {
    transactionResult = await prisma.$transaction(
      async (transaction) => {
        const memorial = await transaction.petMemorial.findUnique({
          where: { id: memorialId },
        });

        assertMemorialDraftCapability(memorial, capability, {
          allowedStatuses: ["DRAFT"],
        });

        const expiredReservations =
          await transaction.petMemorialUploadReservation.findMany({
            where: {
              memorialId,
              state: "PENDING",
              finalizationDeadline: { lt: now },
            },
            select: {
              id: true,
              publicId: true,
            },
          });

        if (expiredReservations.length > 0) {
          await transaction.petMemorialUploadReservation.updateMany({
            where: {
              id: { in: expiredReservations.map(({ id }) => id) },
              state: "PENDING",
            },
            data: {
              state: "REVIEW_REQUIRED",
              reviewRequiredAt: now,
              reviewReason: "FINALIZATION_DEADLINE_EXPIRED",
            },
          });
        }

        const [finalizedImages, pendingReservations, lifetimeReservations] =
          await Promise.all([
            transaction.petMemorialImage.count({
              where: {
                memorialId,
                deletedAt: null,
              },
            }),
            transaction.petMemorialUploadReservation.count({
              where: {
                memorialId,
                state: "PENDING",
              },
            }),
            transaction.petMemorialUploadReservation.count({
              where: { memorialId },
            }),
          ]);

        if (lifetimeReservations >= MAX_LIFETIME_RESERVATIONS) {
          throw new MemorialUploadError(
            "This memorial has used all available photo upload attempts.",
            409,
            { code: "RESERVATION_BUDGET_EXHAUSTED" }
          );
        }

        if (finalizedImages + pendingReservations >= MAX_IMAGES) {
          throw new MemorialUploadError(
            `You can upload up to ${MAX_IMAGES} photos.`,
            409
          );
        }

        const reservation =
          await transaction.petMemorialUploadReservation.create({
            data: {
              memorialId,
              nonce: randomUUID(),
              purpose: MEMORIAL_UPLOAD_POLICY.purpose,
              publicId: randomUUID(),
              resourceType: MEMORIAL_UPLOAD_POLICY.resourceType,
              deliveryType: MEMORIAL_UPLOAD_POLICY.deliveryType,
              folder: MEMORIAL_UPLOAD_POLICY.folder,
              preset: MEMORIAL_UPLOAD_POLICY.preset,
              maxBytes: MEMORIAL_UPLOAD_POLICY.maxBytes,
              allowedFormats: MEMORIAL_UPLOAD_POLICY.allowedFormats,
              transformation: MEMORIAL_UPLOAD_POLICY.transformation,
              uploadDeadline,
              finalizationDeadline,
              reviewAfter,
            },
          });

        return { reservation, expiredReservations };
      },
      { isolationLevel: "Serializable" }
    );
  } catch (error) {
    if (isSerializableConflict(error)) {
      throw new MemorialUploadError(
        "Another memorial image request completed first. Please retry.",
        409
      );
    }

    throw error;
  }

  for (const expired of transactionResult.expiredReservations) {
    await bestEffortTagMemorialForReview(expired.publicId);
  }

  const uploadParams = uploadParamsForReservation(
    transactionResult.reservation
  );

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      cloudName
    )}/${MEMORIAL_UPLOAD_POLICY.resourceType}/upload`,
    apiKey,
    signature: cloudinary.utils.api_sign_request(uploadParams, apiSecret),
    uploadParams,
    reservation: {
      id: transactionResult.reservation.id,
      uploadDeadline:
        transactionResult.reservation.uploadDeadline.toISOString(),
      finalizationDeadline:
        transactionResult.reservation.finalizationDeadline.toISOString(),
    },
    policy: {
      acceptedMimeTypes: MEMORIAL_UPLOAD_POLICY.acceptedMimeTypes,
      allowedFormats: MEMORIAL_UPLOAD_POLICY.allowedFormats,
      maxBytes: MEMORIAL_UPLOAD_POLICY.maxBytes,
      maxImages: MAX_IMAGES,
      maxLifetimeReservations: MAX_LIFETIME_RESERVATIONS,
    },
  };
}

function publicIdMatchesReservation(publicId, reservation) {
  return (
    publicId === reservation.publicId ||
    publicId === `${reservation.folder}/${reservation.publicId}`
  );
}

function folderMatchesReservation(resource, reservation) {
  if (resource?.asset_folder) {
    return resource.asset_folder === reservation.folder;
  }

  return resource?.public_id?.startsWith(`${reservation.folder}/`);
}

function parseProviderCreatedAt(resource) {
  const createdAt = new Date(resource?.created_at);

  if (!Number.isFinite(createdAt.getTime())) {
    throw new MemorialUploadError(
      "The uploaded image has an invalid provider timestamp.",
      400,
      { markReview: true }
    );
  }

  return createdAt;
}

function assertReservationPolicy(reservation) {
  const matches =
    reservation.purpose === MEMORIAL_UPLOAD_POLICY.purpose &&
    reservation.resourceType === MEMORIAL_UPLOAD_POLICY.resourceType &&
    reservation.deliveryType === MEMORIAL_UPLOAD_POLICY.deliveryType &&
    reservation.folder === MEMORIAL_UPLOAD_POLICY.folder &&
    reservation.preset === MEMORIAL_UPLOAD_POLICY.preset &&
    reservation.maxBytes === MEMORIAL_UPLOAD_POLICY.maxBytes &&
    reservation.transformation === MEMORIAL_UPLOAD_POLICY.transformation &&
    JSON.stringify(reservation.allowedFormats) ===
      JSON.stringify(MEMORIAL_UPLOAD_POLICY.allowedFormats);

  if (!matches) {
    throw new MemorialUploadError(
      "The memorial upload reservation policy is invalid.",
      409,
      { markReview: true }
    );
  }
}

export async function verifyMemorialProviderUpload(reservation, proof) {
  getCloudinaryConfiguration();
  assertReservationPolicy(reservation);

  const publicId = String(proof?.publicId || "");
  const assetId = String(proof?.assetId || "");
  const version = Number(proof?.version);
  const responseSignature = String(proof?.responseSignature || "");

  if (
    !publicIdMatchesReservation(publicId, reservation) ||
    !assetId ||
    !Number.isInteger(version) ||
    version <= 0 ||
    !responseSignature ||
    !cloudinary.utils.verify_api_response_signature(
      publicId,
      version,
      responseSignature
    )
  ) {
    throw new MemorialUploadError(
      "The Cloudinary upload response could not be verified.",
      400,
      { markReview: true }
    );
  }

  let resource;

  try {
    resource = await cloudinary.api.resource(publicId, {
      resource_type: reservation.resourceType,
      type: reservation.deliveryType,
      context: true,
      tags: true,
    });
  } catch (error) {
    const providerNotFound =
      error?.http_code === 404 || error?.error?.http_code === 404;

    throw new MemorialUploadError(
      providerNotFound
        ? "The uploaded image could not be found for verification."
        : "The uploaded image could not be verified with the provider.",
      providerNotFound ? 409 : 502,
      { markReview: providerNotFound }
    );
  }

  const context = resource?.context?.custom || resource?.context || {};
  const tags = Array.isArray(resource?.tags) ? resource.tags : [];
  const format = String(resource?.format || "").toLowerCase();
  const bytes = Number(resource?.bytes);
  const width = Number(resource?.width);
  const height = Number(resource?.height);
  const authoritativeVersion = Number(resource?.version);
  const authoritativeAssetId = String(resource?.asset_id || "");
  const createdAt = parseProviderCreatedAt(resource);
  const createdAtSeconds = Math.floor(createdAt.getTime() / 1000);
  const reservationCreatedAt = Math.floor(
    reservation.createdAt.getTime() / 1000
  );
  const uploadDeadline = Math.floor(
    reservation.uploadDeadline.getTime() / 1000
  );
  const finalizationDeadline = Math.floor(
    reservation.finalizationDeadline.getTime() / 1000
  );

  const authoritative =
    resource?.public_id === publicId &&
    resource?.resource_type === reservation.resourceType &&
    resource?.type === reservation.deliveryType &&
    folderMatchesReservation(resource, reservation) &&
    authoritativeAssetId === assetId &&
    Number.isInteger(authoritativeVersion) &&
    authoritativeVersion === version &&
    authoritativeVersion >= reservationCreatedAt - CLOCK_SKEW_SECONDS &&
    authoritativeVersion <= uploadDeadline &&
    createdAtSeconds >= reservationCreatedAt - CLOCK_SKEW_SECONDS &&
    createdAtSeconds <= uploadDeadline &&
    reservation.allowedFormats.includes(format) &&
    Number.isInteger(bytes) &&
    bytes > 0 &&
    bytes <= reservation.maxBytes &&
    Number.isInteger(width) &&
    width > 0 &&
    width <= MEMORIAL_UPLOAD_POLICY.maxDimension &&
    Number.isInteger(height) &&
    height > 0 &&
    height <= MEMORIAL_UPLOAD_POLICY.maxDimension &&
    context.memorial_upload_purpose === reservation.purpose &&
    context.reservation_nonce === reservation.nonce &&
    String(context.upload_expires) === String(uploadDeadline) &&
    String(context.finalize_expires) === String(finalizationDeadline) &&
    String(context.max_bytes) === String(reservation.maxBytes) &&
    tags.includes(PENDING_TAG) &&
    tags.includes(reservation.purpose) &&
    typeof resource?.secure_url === "string" &&
    resource.secure_url.startsWith("https://res.cloudinary.com/");

  if (!authoritative) {
    throw new MemorialUploadError(
      "The uploaded image does not match its reservation.",
      400,
      { markReview: true }
    );
  }

  return {
    publicId: resource.public_id,
    assetId: authoritativeAssetId,
    version: authoritativeVersion,
    resourceType: resource.resource_type,
    format,
    bytes,
    width,
    height,
    secureUrl: resource.secure_url,
    createdAt,
  };
}

export async function markMemorialReservationForReview(
  memorialId,
  reservationId,
  reason
) {
  const reviewRequiredAt = new Date();
  const boundedReason = String(reason || "MANUAL_REVIEW_REQUIRED")
    .replace(/[^A-Z0-9_-]/gi, "_")
    .slice(0, 80);

  const transition = await prisma.petMemorialUploadReservation.updateMany({
    where: {
      id: reservationId,
      memorialId,
      state: "PENDING",
    },
    data: {
      state: "REVIEW_REQUIRED",
      reviewRequiredAt,
      reviewReason: boundedReason || "MANUAL_REVIEW_REQUIRED",
    },
  });

  const reservation =
    await prisma.petMemorialUploadReservation.findUnique({
      where: { id: reservationId },
      select: {
        memorialId: true,
        publicId: true,
        state: true,
      },
    });

  if (!reservation || reservation.memorialId !== memorialId) {
    throw new MemorialUploadError("Upload reservation not found.", 404);
  }

  if (transition.count !== 1 && reservation.state === "FINALIZED") {
    throw new MemorialUploadError(
      "This upload reservation has already been finalized.",
      409
    );
  }

  await bestEffortTagMemorialForReview(reservation.publicId);

  return {
    state: reservation.state === "PENDING" ? "REVIEW_REQUIRED" : reservation.state,
  };
}

export async function reconcileExpiredMemorialUploadReservations({
  limit = 50,
} = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const now = new Date();
  const reservations =
    await prisma.petMemorialUploadReservation.findMany({
      where: {
        state: "PENDING",
        reviewAfter: { lte: now },
      },
      orderBy: [
        { reviewAfter: "asc" },
        { createdAt: "asc" },
        { id: "asc" },
      ],
      take: safeLimit,
      select: {
        id: true,
        memorialId: true,
        publicId: true,
        createdAt: true,
        reviewAfter: true,
      },
    });
  const results = [];

  for (const reservation of reservations) {
    const transition =
      await prisma.petMemorialUploadReservation.updateMany({
        where: {
          id: reservation.id,
          state: "PENDING",
          reviewAfter: { lte: now },
        },
        data: {
          state: "REVIEW_REQUIRED",
          reviewRequiredAt: now,
          reviewReason: "RESERVATION_ABANDONED_AFTER_DEADLINE",
        },
      });

    if (transition.count !== 1) {
      results.push({
        reservationId: reservation.id,
        memorialId: reservation.memorialId,
        publicId: reservation.publicId,
        action: "already-processed",
      });
      continue;
    }

    const tagged = await bestEffortTagMemorialForReview(
      reservation.publicId
    );

    results.push({
      reservationId: reservation.id,
      memorialId: reservation.memorialId,
      publicId: reservation.publicId,
      createdAt: reservation.createdAt,
      reviewAfter: reservation.reviewAfter,
      action: "review-required",
      manualReviewTagAdded: tagged,
    });
  }

  return {
    eligible: reservations.length,
    processed: results.length,
    reviewRequired: results.filter(
      ({ action }) => action === "review-required"
    ).length,
    results,
  };
}

export function isMemorialTransactionConflict(error) {
  return isSerializableConflict(error);
}

export const MEMORIAL_MAX_IMAGES = MAX_IMAGES;
