-- CreateEnum
CREATE TYPE "FosterCatStatus" AS ENUM ('ACTIVE', 'FUNDED', 'ADOPTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DonationTarget" AS ENUM ('GENERAL', 'FOSTER_CAT');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "FosterCat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortBio" TEXT NOT NULL,
    "story" TEXT,
    "careNeeds" TEXT,
    "ageLabel" TEXT,
    "sex" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT NOT NULL,
    "imageAssetId" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "imageFormat" TEXT,
    "imageBytes" INTEGER,
    "imageAlt" TEXT,
    "goalCents" INTEGER,
    "status" "FosterCatStatus" NOT NULL DEFAULT 'ACTIVE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FosterCat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "target" "DonationTarget" NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "fosterCatId" TEXT,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "receiptSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FosterCat_slug_key" ON "FosterCat"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FosterCat_imagePublicId_key" ON "FosterCat"("imagePublicId");

-- CreateIndex
CREATE INDEX "FosterCat_status_idx" ON "FosterCat"("status");

-- CreateIndex
CREATE INDEX "FosterCat_isFeatured_sortOrder_idx" ON "FosterCat"("isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "FosterCat_deletedAt_idx" ON "FosterCat"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_stripeSessionId_key" ON "Donation"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_stripePaymentIntentId_key" ON "Donation"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_stripeChargeId_key" ON "Donation"("stripeChargeId");

-- CreateIndex
CREATE INDEX "Donation_status_idx" ON "Donation"("status");

-- CreateIndex
CREATE INDEX "Donation_target_idx" ON "Donation"("target");

-- CreateIndex
CREATE INDEX "Donation_fosterCatId_idx" ON "Donation"("fosterCatId");

-- CreateIndex
CREATE INDEX "Donation_paidAt_idx" ON "Donation"("paidAt");

-- CreateIndex
CREATE INDEX "Donation_createdAt_idx" ON "Donation"("createdAt");

-- CreateIndex
CREATE INDEX "Donation_fosterCatId_status_idx" ON "Donation"("fosterCatId", "status");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_fosterCatId_fkey" FOREIGN KEY ("fosterCatId") REFERENCES "FosterCat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
