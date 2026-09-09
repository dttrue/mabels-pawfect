-- CreateEnum
CREATE TYPE "AdminUploadState" AS ENUM ('PENDING', 'CONSUMED', 'RECONCILED', 'REVIEW_REQUIRED', 'CLOSED_NO_ASSET');

-- CreateTable
CREATE TABLE "AdminUploadGrant" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "state" "AdminUploadState" NOT NULL DEFAULT 'PENDING',
    "uploadDeadline" TIMESTAMP(3) NOT NULL,
    "finalizationDeadline" TIMESTAMP(3) NOT NULL,
    "reconcileAfter" TIMESTAMP(3) NOT NULL,
    "nextReconcileAt" TIMESTAMP(3) NOT NULL,
    "reconciliationAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastReconcileError" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "providerPublicId" TEXT,
    "providerAssetId" TEXT,
    "providerVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUploadGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUploadGrant_nonce_key" ON "AdminUploadGrant"("nonce");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUploadGrant_providerAssetId_key" ON "AdminUploadGrant"("providerAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUploadGrant_resourceType_publicId_key" ON "AdminUploadGrant"("resourceType", "publicId");

-- CreateIndex
CREATE INDEX "AdminUploadGrant_state_nextReconcileAt_idx" ON "AdminUploadGrant"("state", "nextReconcileAt");
