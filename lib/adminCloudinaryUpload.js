import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";

const IMAGE_UPLOAD_TTL_SECONDS = 10 * 60;
const PDF_UPLOAD_TTL_SECONDS = 15 * 60;
const VIDEO_UPLOAD_TTL_SECONDS = 55 * 60;
const IMAGE_FINALIZATION_GRACE_SECONDS = 5 * 60;
const PDF_FINALIZATION_GRACE_SECONDS = 5 * 60;
const VIDEO_FINALIZATION_GRACE_SECONDS = 10 * 60;
const RECONCILIATION_DELAY_SECONDS = 15 * 60;
const CLOCK_SKEW_SECONDS = 30;
const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"];

const STATIC_PURPOSES = {
  "shop-image": {
    resourceType: "image",
    folder: "pawfect/shop/products",
    preset: "mabels-shop-uploads",
    maxBytes: 10 * 1024 * 1024,
    allowedFormats: IMAGE_FORMATS,
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    transformation: "c_limit,w_2400,h_2400,q_auto:good",
    maxWidth: 2400,
    maxHeight: 2400,
    uploadTtlSeconds: IMAGE_UPLOAD_TTL_SECONDS,
    finalizationGraceSeconds: IMAGE_FINALIZATION_GRACE_SECONDS,
  },
  "site-image": {
    resourceType: "image",
    folder: "pawfect/site/assets",
    preset: "mabels-site-admin-uploads",
    maxBytes: 10 * 1024 * 1024,
    allowedFormats: IMAGE_FORMATS,
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    transformation: "c_limit,w_3200,h_3200,q_auto:good",
    maxWidth: 3200,
    maxHeight: 3200,
    uploadTtlSeconds: IMAGE_UPLOAD_TTL_SECONDS,
    finalizationGraceSeconds: IMAGE_FINALIZATION_GRACE_SECONDS,
  },
  "gallery-image": {
    resourceType: "image",
    folder: "pawfect/gallery",
    preset: "mabels-gallery-admin-uploads",
    maxBytes: 10 * 1024 * 1024,
    allowedFormats: IMAGE_FORMATS,
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    transformation: "c_limit,w_2400,h_2400,q_auto:good",
    maxWidth: 2400,
    maxHeight: 2400,
    uploadTtlSeconds: IMAGE_UPLOAD_TTL_SECONDS,
    finalizationGraceSeconds: IMAGE_FINALIZATION_GRACE_SECONDS,
  },
  "newsletter-image": {
    resourceType: "image",
    folder: "pawfect/newsletters/images",
    preset: "mabels-newsletter-image-admin-uploads",
    maxBytes: 10 * 1024 * 1024,
    allowedFormats: IMAGE_FORMATS,
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    transformation: "c_limit,w_2400,h_2400,q_auto:good",
    maxWidth: 2400,
    maxHeight: 2400,
    uploadTtlSeconds: IMAGE_UPLOAD_TTL_SECONDS,
    finalizationGraceSeconds: IMAGE_FINALIZATION_GRACE_SECONDS,
  },
  "newsletter-pdf": {
    resourceType: "image",
    folder: "pawfect/newsletters/documents",
    preset: "mabels-newsletter-pdf-admin-uploads",
    maxBytes: 10_485_760,
    allowedFormats: ["pdf"],
    acceptedMimeTypes: ["application/pdf"],
    transformation: null,
    uploadTtlSeconds: PDF_UPLOAD_TTL_SECONDS,
    finalizationGraceSeconds: PDF_FINALIZATION_GRACE_SECONDS,
  },
  "foster-cat-image": {
    resourceType: "image",
    folder: "mabels-pawfect/foster-cats",
    preset: "mabels-foster-admin-uploads",
    maxBytes: 10 * 1024 * 1024,
    allowedFormats: IMAGE_FORMATS,
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    transformation: "c_limit,w_2000,h_2000,q_auto:good",
    maxWidth: 2000,
    maxHeight: 2000,
    uploadTtlSeconds: IMAGE_UPLOAD_TTL_SECONDS,
    finalizationGraceSeconds: IMAGE_FINALIZATION_GRACE_SECONDS,
  },
  "highlight-video": {
    resourceType: "video",
    folder: "highlights/2025",
    preset: "mabels-highlight-video-admin-uploads",
    maxBytes: 104_857_600,
    allowedFormats: ["mp4", "mov"],
    acceptedMimeTypes: ["video/mp4", "video/quicktime"],
    transformation: "c_limit,w_1920,h_1080,q_auto:good",
    uploadTtlSeconds: VIDEO_UPLOAD_TTL_SECONDS,
    finalizationGraceSeconds: VIDEO_FINALIZATION_GRACE_SECONDS,
  },
};

export class AdminUploadError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "AdminUploadError";
    this.status = status;
  }
}

export async function readSmallJson(req, maxBytes = 64 * 1024) {
  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new AdminUploadError("Request body is too large", 413);
  }
  if (!req.body) throw new AdminUploadError("Invalid JSON", 400);

  const reader = req.body.getReader();
  const chunks = [];
  let bytesRead = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel();
        throw new AdminUploadError("Request body is too large", 413);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(Buffer.concat(chunks, bytesRead).toString("utf8"));
  } catch {
    throw new AdminUploadError("Invalid JSON", 400);
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
    throw new AdminUploadError("Cloudinary upload is not configured", 500);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return { cloudName, apiKey, apiSecret };
}

function getGrantSecret() {
  const grantSecret = process.env.ADMIN_UPLOAD_GRANT_SECRET;
  if (!grantSecret || Buffer.byteLength(grantSecret, "utf8") < 32) {
    throw new AdminUploadError(
      "Administrative upload grants are not configured",
      500
    );
  }
  return grantSecret;
}

function purposeConfiguration(purpose, scope = {}) {
  if (purpose === "contest-image") {
    const contestSlug = String(scope?.contestSlug || "").trim();
    if (!/^[a-z0-9-]{1,80}$/.test(contestSlug)) {
      throw new AdminUploadError("Invalid contest slug");
    }
    return {
      resourceType: "image",
      folder: `pawfect/contest/${contestSlug}`,
      preset: "mabels-contest-uploads",
      maxBytes: 10 * 1024 * 1024,
      allowedFormats: IMAGE_FORMATS,
      acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      transformation: "c_limit,w_2000,h_2000,q_auto:good",
      maxWidth: 2000,
      maxHeight: 2000,
      uploadTtlSeconds: IMAGE_UPLOAD_TTL_SECONDS,
      finalizationGraceSeconds: IMAGE_FINALIZATION_GRACE_SECONDS,
      scope: { contestSlug },
    };
  }

  const config = STATIC_PURPOSES[purpose];
  if (!config) throw new AdminUploadError("Invalid upload purpose");
  return { ...config, scope: {} };
}

function grantPayload(grant) {
  return JSON.stringify([
    grant.purpose,
    grant.resourceType,
    grant.folder,
    grant.preset,
    grant.publicId,
    grant.maxBytes,
    grant.allowedFormats,
    grant.acceptedMimeTypes,
    grant.transformation,
    grant.timestamp,
    grant.expiresAt,
    grant.finalizationExpiresAt,
    grant.reconcileAfter,
    grant.nonce,
    grant.scope,
    grant.grantTtlSeconds,
    grant.finalizationGraceSeconds,
    grant.reconciliationDelaySeconds,
  ]);
}

function signGrant(grant, grantSecret) {
  return createHmac("sha256", grantSecret)
    .update(grantPayload(grant))
    .digest("hex");
}

function secureEquals(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function uploadParamsForGrant(grant) {
  const params = {
    timestamp: grant.timestamp,
    upload_preset: grant.preset,
    folder: grant.folder,
    public_id: grant.publicId,
    overwrite: "false",
    unique_filename: "false",
    use_filename: "false",
    allowed_formats: grant.allowedFormats.join(","),
    context: `admin_purpose=${grant.purpose}|grant_nonce=${grant.nonce}|grant_expires=${grant.expiresAt}|grant_finalize_expires=${grant.finalizationExpiresAt}`,
    tags: `mabels-admin-pending,${grant.purpose}`,
    type: "upload",
  };
  if (grant.transformation) params.transformation = grant.transformation;
  return params;
}

export async function issueAdminUploadGrant(purpose, scope = {}) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfiguration();
  const grantSecret = getGrantSecret();
  const config = purposeConfiguration(purpose, scope);
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadDeadline = timestamp + config.uploadTtlSeconds;
  const finalizationDeadline = uploadDeadline + config.finalizationGraceSeconds;
  const reconcileAfter = finalizationDeadline + RECONCILIATION_DELAY_SECONDS;
  const grant = {
    purpose,
    resourceType: config.resourceType,
    folder: config.folder,
    preset: config.preset,
    publicId: randomUUID(),
    maxBytes: config.maxBytes,
    allowedFormats: config.allowedFormats,
    acceptedMimeTypes: config.acceptedMimeTypes,
    transformation: config.transformation,
    timestamp,
    expiresAt: uploadDeadline,
    finalizationExpiresAt: finalizationDeadline,
    reconcileAfter,
    nonce: randomUUID(),
    scope: config.scope,
    grantTtlSeconds: config.uploadTtlSeconds,
    finalizationGraceSeconds: config.finalizationGraceSeconds,
    reconciliationDelaySeconds: RECONCILIATION_DELAY_SECONDS,
  };
  const uploadParams = uploadParamsForGrant(grant);

  await prisma.adminUploadGrant.create({
    data: {
      nonce: grant.nonce,
      purpose: grant.purpose,
      publicId: grant.publicId,
      resourceType: grant.resourceType,
      folder: grant.folder,
      uploadDeadline: new Date(grant.expiresAt * 1000),
      finalizationDeadline: new Date(grant.finalizationExpiresAt * 1000),
      reconcileAfter: new Date(grant.reconcileAfter * 1000),
      nextReconcileAt: new Date(grant.reconcileAfter * 1000),
    },
  });

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${grant.resourceType}/upload`,
    apiKey,
    signature: cloudinary.utils.api_sign_request(uploadParams, apiSecret),
    uploadParams,
    grant,
    grantSignature: signGrant(grant, grantSecret),
  };
}

function validateGrantPolicy(grant, expectedPurpose) {
  if (!grant || grant.purpose !== expectedPurpose) {
    throw new AdminUploadError("Invalid upload grant", 400);
  }
  const current = purposeConfiguration(expectedPurpose, grant.scope);
  const policyMatches =
    grant.resourceType === current.resourceType &&
    grant.folder === current.folder &&
    grant.preset === current.preset &&
    grant.maxBytes === current.maxBytes &&
    grant.transformation === current.transformation &&
    JSON.stringify(grant.allowedFormats) === JSON.stringify(current.allowedFormats) &&
    JSON.stringify(grant.acceptedMimeTypes) === JSON.stringify(current.acceptedMimeTypes);
  if (!policyMatches) {
    throw new AdminUploadError("Upload grant policy mismatch", 400);
  }

  const integerFields = [
    grant.timestamp,
    grant.expiresAt,
    grant.finalizationExpiresAt,
    grant.reconcileAfter,
    grant.grantTtlSeconds,
    grant.finalizationGraceSeconds,
    grant.reconciliationDelaySeconds,
  ];
  const validWindows =
    integerFields.every(Number.isInteger) &&
    grant.grantTtlSeconds === current.uploadTtlSeconds &&
    grant.finalizationGraceSeconds === current.finalizationGraceSeconds &&
    grant.reconciliationDelaySeconds === RECONCILIATION_DELAY_SECONDS &&
    grant.expiresAt - grant.timestamp === grant.grantTtlSeconds &&
    grant.finalizationExpiresAt - grant.expiresAt === grant.finalizationGraceSeconds &&
    grant.reconcileAfter - grant.finalizationExpiresAt === grant.reconciliationDelaySeconds;
  if (!validWindows) throw new AdminUploadError("Invalid upload grant", 400);

  const now = Math.floor(Date.now() / 1000);
  if (now < grant.timestamp - CLOCK_SKEW_SECONDS) {
    throw new AdminUploadError("Invalid upload grant", 400);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(grant.publicId || ""))) {
    throw new AdminUploadError("Invalid upload grant", 400);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(grant.nonce || ""))) {
    throw new AdminUploadError("Invalid upload grant", 400);
  }

  return current;
}

function publicIdMatchesGrant(actualPublicId, grant) {
  return actualPublicId === grant.publicId || actualPublicId === `${grant.folder}/${grant.publicId}`;
}

function resourceMatchesFolder(resource, grant) {
  if (resource.asset_folder) return resource.asset_folder === grant.folder;
  return resource.public_id.startsWith(`${grant.folder}/`);
}

function parseAuthoritativeCreatedAt(resource) {
  const createdAt = new Date(resource?.created_at);
  if (!Number.isFinite(createdAt.getTime())) {
    throw new AdminUploadError("Uploaded asset has invalid provider time", 400);
  }
  return createdAt;
}

function resourceDimensionsMatchPolicy(resource, policy) {
  const hasWidthLimit = policy.maxWidth !== undefined;
  const hasHeightLimit = policy.maxHeight !== undefined;
  if (!hasWidthLimit && !hasHeightLimit) return true;
  if (
    !Number.isInteger(policy.maxWidth) ||
    policy.maxWidth <= 0 ||
    !Number.isInteger(policy.maxHeight) ||
    policy.maxHeight <= 0
  ) {
    return false;
  }

  return (
    Number.isInteger(resource?.width) &&
    resource.width > 0 &&
    resource.width <= policy.maxWidth &&
    Number.isInteger(resource?.height) &&
    resource.height > 0 &&
    resource.height <= policy.maxHeight
  );
}

function assertLedgerMatchesGrant(ledger, grant) {
  const matches =
    ledger &&
    ledger.purpose === grant.purpose &&
    ledger.publicId === grant.publicId &&
    ledger.resourceType === grant.resourceType &&
    ledger.folder === grant.folder &&
    ledger.uploadDeadline.getTime() === grant.expiresAt * 1000 &&
    ledger.finalizationDeadline.getTime() === grant.finalizationExpiresAt * 1000 &&
    ledger.reconcileAfter.getTime() === grant.reconcileAfter * 1000;
  if (!matches) throw new AdminUploadError("Upload grant ledger mismatch", 400);
}

export async function verifyAdminUploadProof(proof, expectedPurpose) {
  getCloudinaryConfiguration();
  const grantSecret = getGrantSecret();
  const grant = proof?.grant;
  const policy = validateGrantPolicy(grant, expectedPurpose);
  if (!secureEquals(proof?.grantSignature, signGrant(grant, grantSecret))) {
    throw new AdminUploadError("Invalid upload grant", 400);
  }

  const ledger = await prisma.adminUploadGrant.findUnique({
    where: { nonce: grant.nonce },
  });
  assertLedgerMatchesGrant(ledger, grant);
  if (ledger.state === "CONSUMED") {
    throw new AdminUploadError("Upload proof already consumed", 409);
  }
  if (ledger.state !== "PENDING") {
    throw new AdminUploadError("Upload proof is no longer pending", 409);
  }
  if (Date.now() > ledger.finalizationDeadline.getTime()) {
    throw new AdminUploadError("Upload finalization deadline expired", 410);
  }

  const publicId = String(proof?.publicId || "");
  const version = Number(proof?.version);
  const responseSignature = String(proof?.responseSignature || "");
  if (
    !publicIdMatchesGrant(publicId, grant) ||
    !Number.isInteger(version) ||
    version <= 0 ||
    !responseSignature ||
    !cloudinary.utils.verify_api_response_signature(publicId, version, responseSignature)
  ) {
    throw new AdminUploadError("Invalid Cloudinary upload response", 400);
  }

  let resource;
  try {
    resource = await cloudinary.api.resource(publicId, {
      resource_type: grant.resourceType,
      type: "upload",
      context: true,
      tags: true,
    });
  } catch {
    throw new AdminUploadError("Unable to verify uploaded asset", 502);
  }

  const format = String(resource?.format || "").toLowerCase();
  const bytes = Number(resource?.bytes);
  const authoritativeVersion = Number(resource?.version);
  const createdAt = parseAuthoritativeCreatedAt(resource);
  const createdAtSeconds = Math.floor(createdAt.getTime() / 1000);
  const context = resource?.context?.custom || resource?.context || {};
  const tags = Array.isArray(resource?.tags) ? resource.tags : [];
  const authoritative =
    resource?.public_id === publicId &&
    resource?.resource_type === grant.resourceType &&
    resource?.type === "upload" &&
    resourceMatchesFolder(resource, grant) &&
    Number.isInteger(authoritativeVersion) &&
    authoritativeVersion > 0 &&
    authoritativeVersion === version &&
    authoritativeVersion >= grant.timestamp - CLOCK_SKEW_SECONDS &&
    authoritativeVersion <= grant.expiresAt &&
    createdAtSeconds >= grant.timestamp - CLOCK_SKEW_SECONDS &&
    createdAtSeconds <= grant.expiresAt &&
    grant.allowedFormats.includes(format) &&
    context.admin_purpose === grant.purpose &&
    context.grant_nonce === grant.nonce &&
    String(context.grant_expires) === String(grant.expiresAt) &&
    String(context.grant_finalize_expires) === String(grant.finalizationExpiresAt) &&
    tags.includes("mabels-admin-pending") &&
    tags.includes(grant.purpose) &&
    Number.isFinite(bytes) &&
    bytes > 0 &&
    bytes <= grant.maxBytes &&
    resourceDimensionsMatchPolicy(resource, policy) &&
    typeof resource?.secure_url === "string" &&
    resource.secure_url.startsWith("https://res.cloudinary.com/");
  if (!authoritative) {
    throw new AdminUploadError("Uploaded asset violates its grant", 400);
  }

  return {
    publicId: resource.public_id,
    secureUrl: resource.secure_url,
    assetId: resource.asset_id || null,
    version: authoritativeVersion,
    createdAt,
    resourceType: resource.resource_type,
    format,
    bytes,
    width: Number.isFinite(resource.width) ? resource.width : null,
    height: Number.isFinite(resource.height) ? resource.height : null,
    duration: Number.isFinite(resource.duration) ? resource.duration : null,
    grant,
  };
}

export async function consumeAdminUploadGrant(transaction, asset) {
  const now = new Date();
  const transition = await transaction.adminUploadGrant.updateMany({
    where: {
      nonce: asset.grant.nonce,
      purpose: asset.grant.purpose,
      publicId: asset.grant.publicId,
      resourceType: asset.grant.resourceType,
      state: "PENDING",
      finalizationDeadline: { gte: now },
    },
    data: {
      state: "CONSUMED",
      consumedAt: now,
      providerPublicId: asset.publicId,
      providerAssetId: asset.assetId,
      providerVersion: asset.version,
    },
  });
  if (transition.count === 1) return;

  const current = await transaction.adminUploadGrant.findUnique({
    where: { nonce: asset.grant.nonce },
  });
  if (current?.state === "CONSUMED") {
    throw new AdminUploadError("Upload proof already consumed", 409);
  }
  if (current && current.finalizationDeadline < now) {
    throw new AdminUploadError("Upload finalization deadline expired", 410);
  }
  throw new AdminUploadError("Upload proof is no longer pending", 409);
}

export async function markAdminUploadPersisted(publicId, resourceType = "image") {
  if (!publicId) return;
  try {
    getCloudinaryConfiguration();
    await cloudinary.uploader.remove_tag("mabels-admin-pending", [publicId], {
      resource_type: resourceType,
      type: "upload",
    });
  } catch {
    // Reconciliation repairs the tag after the safe-delay window.
  }
}

function isProviderNotFound(error) {
  return error?.http_code === 404 || error?.error?.http_code === 404;
}

export async function findAuthoritativeLedgerResource(ledger) {
  getCloudinaryConfiguration();
  const candidates = [
    ledger.providerPublicId,
    ledger.publicId,
    `${ledger.folder}/${ledger.publicId}`,
  ].filter((value, index, values) => value && values.indexOf(value) === index);

  let resource = null;
  for (const publicId of candidates) {
    try {
      resource = await cloudinary.api.resource(publicId, {
        resource_type: ledger.resourceType,
        type: "upload",
        context: true,
        tags: true,
      });
      break;
    } catch (error) {
      if (!isProviderNotFound(error)) {
        throw new AdminUploadError(
          "Unable to identify provider asset during reconciliation",
          502
        );
      }
    }
  }
  if (!resource) return null;

  const context = resource?.context?.custom || resource?.context || {};
  const createdAt = parseAuthoritativeCreatedAt(resource);
  const createdAtSeconds = Math.floor(createdAt.getTime() / 1000);
  const providerVersion = Number(resource?.version);
  const providerAssetId =
    typeof resource?.asset_id === "string" && resource.asset_id
      ? resource.asset_id
      : null;
  const resourceFolderMatches = resource.asset_folder
    ? resource.asset_folder === ledger.folder
    : resource.public_id.startsWith(`${ledger.folder}/`);
  const identityMatches =
    candidates.includes(resource.public_id) &&
    resource.resource_type === ledger.resourceType &&
    resource.type === "upload" &&
    resourceFolderMatches &&
    context.admin_purpose === ledger.purpose &&
    context.grant_nonce === ledger.nonce &&
    String(context.grant_expires) === String(Math.floor(ledger.uploadDeadline.getTime() / 1000)) &&
    String(context.grant_finalize_expires) === String(Math.floor(ledger.finalizationDeadline.getTime() / 1000)) &&
    Number.isInteger(providerVersion) &&
    providerVersion > 0 &&
    providerVersion >=
      Math.floor(ledger.createdAt.getTime() / 1000) - CLOCK_SKEW_SECONDS &&
    providerVersion <= Math.floor(ledger.uploadDeadline.getTime() / 1000) &&
    (ledger.providerVersion === null ||
      providerVersion === ledger.providerVersion) &&
    (ledger.providerAssetId === null ||
      providerAssetId === ledger.providerAssetId) &&
    createdAtSeconds >=
      Math.floor(ledger.createdAt.getTime() / 1000) - CLOCK_SKEW_SECONDS &&
    createdAtSeconds <= Math.floor(ledger.uploadDeadline.getTime() / 1000);
  if (!identityMatches) {
    throw new AdminUploadError(
      "Provider asset identity does not match its upload ledger",
      409
    );
  }
  return { ...resource, createdAt, version: providerVersion };
}

export async function repairPendingAdminUploadTag(resource) {
  const tags = Array.isArray(resource?.tags) ? resource.tags : [];
  if (!tags.includes("mabels-admin-pending")) return false;
  getCloudinaryConfiguration();
  await cloudinary.uploader.remove_tag("mabels-admin-pending", [resource.public_id], {
    resource_type: resource.resource_type,
    type: "upload",
  });
  return true;
}

export async function tagAdminUploadForManualReview(resource) {
  getCloudinaryConfiguration();
  await cloudinary.uploader.add_tag(
    "mabels-admin-review-required",
    [resource.public_id],
    {
      resource_type: resource.resource_type,
      type: "upload",
    }
  );
}

export function adminCloudinaryUrl(publicId, options) {
  getCloudinaryConfiguration();
  return cloudinary.url(publicId, { secure: true, ...options });
}
