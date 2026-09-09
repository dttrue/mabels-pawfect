-- CreateEnum
CREATE TYPE "PetMemorialUploadState" AS ENUM ('PENDING', 'FINALIZED', 'REVIEW_REQUIRED');

-- AlterTable
ALTER TABLE "PetMemorial"
ADD COLUMN "draftCapabilityHash" TEXT,
ADD COLUMN "draftCapabilityExpiresAt" TIMESTAMP(3),
ADD COLUMN "draftCapabilityInvalidatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PetMemorialImage"
ADD COLUMN "uploadReservationId" TEXT;

-- CreateTable
CREATE TABLE "PetMemorialUploadReservation" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "deliveryType" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "preset" TEXT NOT NULL,
    "maxBytes" INTEGER NOT NULL,
    "allowedFormats" TEXT[] NOT NULL,
    "transformation" TEXT NOT NULL,
    "state" "PetMemorialUploadState" NOT NULL DEFAULT 'PENDING',
    "uploadDeadline" TIMESTAMP(3) NOT NULL,
    "finalizationDeadline" TIMESTAMP(3) NOT NULL,
    "reviewAfter" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "reviewRequiredAt" TIMESTAMP(3),
    "reviewReason" TEXT,
    "providerPublicId" TEXT,
    "providerAssetId" TEXT,
    "providerVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetMemorialUploadReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorial_draftCapabilityHash_key" ON "PetMemorial"("draftCapabilityHash");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorialImage_uploadReservationId_key" ON "PetMemorialImage"("uploadReservationId");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorialUploadReservation_nonce_key" ON "PetMemorialUploadReservation"("nonce");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorialUploadReservation_publicId_key" ON "PetMemorialUploadReservation"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorialUploadReservation_providerPublicId_key" ON "PetMemorialUploadReservation"("providerPublicId");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorialUploadReservation_providerAssetId_key" ON "PetMemorialUploadReservation"("providerAssetId");

-- CreateIndex
CREATE INDEX "PetMemorialUploadReservation_memorialId_state_idx" ON "PetMemorialUploadReservation"("memorialId", "state");

-- CreateIndex
CREATE INDEX "PetMemorialUploadReservation_state_reviewAfter_idx" ON "PetMemorialUploadReservation"("state", "reviewAfter");

-- AddForeignKey
ALTER TABLE "PetMemorialUploadReservation" ADD CONSTRAINT "PetMemorialUploadReservation_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "PetMemorial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetMemorialImage" ADD CONSTRAINT "PetMemorialImage_uploadReservationId_fkey" FOREIGN KEY ("uploadReservationId") REFERENCES "PetMemorialUploadReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
