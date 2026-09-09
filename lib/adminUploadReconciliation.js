import "server-only";

import prisma from "@/lib/prisma";
import {
  AdminUploadError,
  findAuthoritativeLedgerResource,
  repairPendingAdminUploadTag,
  tagAdminUploadForManualReview,
} from "@/lib/adminCloudinaryUpload";

const ACTIVE_STATES = ["PENDING", "CONSUMED"];
const RETRY_BASE_MILLISECONDS = 5 * 60 * 1000;
const RETRY_MAX_MILLISECONDS = 6 * 60 * 60 * 1000;
const MAX_RECORDED_ATTEMPTS = 1000;
const MAX_ERROR_LENGTH = 240;

function inspectionIdentity(ledger, resource = null) {
  return {
    ledgerId: ledger.id,
    nonce: ledger.nonce,
    purpose: ledger.purpose,
    resourceType: ledger.resourceType,
    requestedPublicId: ledger.publicId,
    providerPublicId: resource?.public_id || ledger.providerPublicId || null,
    providerAssetId: resource?.asset_id || ledger.providerAssetId || null,
    providerVersion:
      Number.isInteger(Number(resource?.version))
        ? Number(resource.version)
        : ledger.providerVersion,
  };
}

async function findDatabaseReferences(resource, ledger) {
  const publicIds = [
    ledger.publicId,
    ledger.providerPublicId,
    resource?.public_id,
  ].filter((value, index, values) => value && values.indexOf(value) === index);
  const assetIds = [ledger.providerAssetId, resource?.asset_id].filter(
    (value, index, values) => value && values.indexOf(value) === index
  );
  const secureUrl = resource?.secure_url;
  const checks = [
    [
      "Review",
      prisma.review.count({
        where: secureUrl ? { imageUrl: secureUrl } : { id: "" },
      }),
    ],
    [
      "Newsletter",
      prisma.newsletter.count({
        where: {
          OR: [
            { publicId: { in: publicIds } },
            ...(secureUrl
              ? [{ imageUrl: secureUrl }, { fileUrl: secureUrl }]
              : []),
          ],
        },
      }),
    ],
    [
      "Gallery",
      prisma.gallery.count({
        where: {
          OR: [
            { publicId: { in: publicIds } },
            ...(secureUrl ? [{ imageUrl: secureUrl }] : []),
          ],
        },
      }),
    ],
    [
      "SiteImage",
      prisma.siteImage.count({
        where: {
          OR: [
            { publicId: { in: publicIds } },
            ...(secureUrl ? [{ imageUrl: secureUrl }] : []),
          ],
        },
      }),
    ],
    [
      "ProductImage",
      prisma.productImage.count({
        where: {
          OR: [
            { publicId: { in: publicIds } },
            ...(secureUrl ? [{ url: secureUrl }] : []),
          ],
        },
      }),
    ],
    [
      "ContestEntry",
      prisma.contestEntry.count({
        where: {
          OR: [
            { publicId: { in: publicIds } },
            ...(secureUrl ? [{ imageUrl: secureUrl }] : []),
          ],
        },
      }),
    ],
    [
      "Highlight",
      prisma.highlight.count({
        where: {
          OR: [
            { publicId: { in: publicIds } },
            ...(secureUrl ? [{ url: secureUrl }, { posterUrl: secureUrl }] : []),
          ],
        },
      }),
    ],
    [
      "PetMemorialImage",
      prisma.petMemorialImage.count({
        where: {
          OR: [
            { publicId: { in: publicIds } },
            ...(assetIds.length > 0 ? [{ assetId: { in: assetIds } }] : []),
            ...(secureUrl ? [{ imageUrl: secureUrl }] : []),
          ],
        },
      }),
    ],
    [
      "FosterCat",
      prisma.fosterCat.count({
        where: {
          OR: [
            { imagePublicId: { in: publicIds } },
            ...(assetIds.length > 0
              ? [{ imageAssetId: { in: assetIds } }]
              : []),
            ...(secureUrl ? [{ imageUrl: secureUrl }] : []),
          ],
        },
      }),
    ],
  ];

  const counts = await Promise.all(checks.map(([, query]) => query));
  return checks
    .map(([model], index) => ({ model, count: counts[index] }))
    .filter(({ count }) => count > 0);
}

function boundedError(error) {
  const message =
    error instanceof AdminUploadError
      ? error.message
      : "Transient reconciliation operation failed";
  return message.replace(/\s+/g, " ").slice(0, MAX_ERROR_LENGTH);
}

function retryDelayMilliseconds(attempts) {
  const exponent = Math.min(Math.max(attempts - 1, 0), 6);
  return Math.min(
    RETRY_BASE_MILLISECONDS * 2 ** exponent,
    RETRY_MAX_MILLISECONDS
  );
}

async function scheduleRetry(ledger, error) {
  const attempts = Math.min(
    ledger.reconciliationAttempts + 1,
    MAX_RECORDED_ATTEMPTS
  );
  const nextReconcileAt = new Date(
    Date.now() + retryDelayMilliseconds(attempts)
  );
  const update = await prisma.adminUploadGrant.updateMany({
    where: { id: ledger.id, state: { in: ACTIVE_STATES } },
    data: {
      reconciliationAttempts: attempts,
      lastReconcileError: boundedError(error),
      nextReconcileAt,
    },
  });
  return { scheduled: update.count === 1, attempts, nextReconcileAt };
}

async function transitionTerminal(ledger, state, resource, lastError = null) {
  const update = await prisma.adminUploadGrant.updateMany({
    where: { id: ledger.id, state: { in: ACTIVE_STATES } },
    data: {
      state,
      reconciledAt: new Date(),
      lastReconcileError: lastError,
      providerPublicId: resource?.public_id || ledger.providerPublicId,
      providerAssetId: resource?.asset_id || ledger.providerAssetId,
      providerVersion: Number.isInteger(Number(resource?.version))
        ? Number(resource.version)
        : ledger.providerVersion,
    },
  });
  return update.count === 1;
}

async function bestEffortTagOperation(operation, failureMessage) {
  try {
    const changed = await operation();
    return { changed: Boolean(changed), error: null };
  } catch {
    return { changed: false, error: failureMessage };
  }
}

export async function reconcileAdminUploads({ limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const now = new Date();
  const ledgers = await prisma.adminUploadGrant.findMany({
    where: {
      state: { in: ACTIVE_STATES },
      reconcileAfter: { lte: now },
      nextReconcileAt: { lte: now },
    },
    orderBy: [
      { nextReconcileAt: "asc" },
      { createdAt: "asc" },
      { id: "asc" },
    ],
    take: safeLimit,
  });
  const results = [];

  for (const ledger of ledgers) {
    try {
      const resource = await findAuthoritativeLedgerResource(ledger);
      const references = await findDatabaseReferences(resource, ledger);
      const identity = inspectionIdentity(ledger, resource);

      if (!resource) {
        const transitioned = await transitionTerminal(
          ledger,
          "CLOSED_NO_ASSET",
          null
        );
        results.push({
          ...identity,
          action: transitioned ? "closed-no-asset" : "already-processed",
          references,
        });
        continue;
      }

      if (references.length > 0) {
        const tagRepair = await bestEffortTagOperation(
          () => repairPendingAdminUploadTag(resource),
          "Pending-tag repair failed; asset was retained"
        );
        const transitioned = await transitionTerminal(
          ledger,
          "RECONCILED",
          resource,
          tagRepair.error
        );
        results.push({
          ...identity,
          action: transitioned ? "reconciled" : "already-processed",
          references,
          pendingTagRemoved: tagRepair.changed,
          warning: tagRepair.error,
        });
        continue;
      }

      const reviewTag = await bestEffortTagOperation(
        () => tagAdminUploadForManualReview(resource),
        "Manual-review tag update failed; asset was retained"
      );
      const transitioned = await transitionTerminal(
        ledger,
        "REVIEW_REQUIRED",
        resource,
        reviewTag.error
      );
      results.push({
        ...identity,
        action: transitioned ? "review-required" : "already-processed",
        references: [],
        manualReviewTagAdded: reviewTag.error === null,
        warning: reviewTag.error,
      });
    } catch (error) {
      if (error instanceof AdminUploadError && error.status < 500) {
        try {
          const transitioned = await transitionTerminal(
            ledger,
            "REVIEW_REQUIRED",
            null,
            boundedError(error)
          );
          results.push({
            ...inspectionIdentity(ledger),
            action: transitioned
              ? "provider-identity-review-required"
              : "already-processed",
            references: [],
            warning: boundedError(error),
          });
        } catch (transitionError) {
          try {
            const retry = await scheduleRetry(ledger, transitionError);
            results.push({
              ...inspectionIdentity(ledger),
              action: retry.scheduled ? "retry-scheduled" : "already-processed",
              attempts: retry.attempts,
              nextReconcileAt: retry.nextReconcileAt,
              error: boundedError(transitionError),
            });
          } catch (retryError) {
            results.push({
              ...inspectionIdentity(ledger),
              action: "retry-scheduling-failed",
              error: boundedError(retryError),
            });
          }
        }
        continue;
      }

      try {
        const retry = await scheduleRetry(ledger, error);
        results.push({
          ...inspectionIdentity(ledger),
          action: retry.scheduled ? "retry-scheduled" : "already-processed",
          attempts: retry.attempts,
          nextReconcileAt: retry.nextReconcileAt,
          error: boundedError(error),
        });
      } catch (retryError) {
        results.push({
          ...inspectionIdentity(ledger),
          action: "retry-scheduling-failed",
          error: boundedError(retryError),
        });
      }
    }
  }

  return {
    eligible: ledgers.length,
    processed: results.length,
    retryScheduled: results.filter(
      ({ action }) => action === "retry-scheduled"
    ).length,
    reviewRequired: results.filter(({ action }) =>
      new Set(["review-required", "provider-identity-review-required"]).has(
        action
      )
    ).length,
    results,
  };
}
