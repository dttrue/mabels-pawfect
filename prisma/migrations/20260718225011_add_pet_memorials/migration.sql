-- CreateEnum
CREATE TYPE "MemorialStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PAID', 'IN_REVIEW', 'PUBLISHED', 'REJECTED', 'REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MemorialPetType" AS ENUM ('DOG', 'CAT', 'BIRD', 'RABBIT', 'REPTILE', 'OTHER');

-- CreateTable
CREATE TABLE "PetMemorial" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "status" "MemorialStatus" NOT NULL DEFAULT 'DRAFT',
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "ownerPhone" TEXT,
    "petName" TEXT NOT NULL,
    "petType" "MemorialPetType",
    "speciesOther" TEXT,
    "breed" TEXT,
    "birthDate" TIMESTAMP(3),
    "passedDate" TIMESTAMP(3),
    "birthYear" INTEGER,
    "passedYear" INTEGER,
    "headline" TEXT,
    "story" TEXT NOT NULL,
    "favoriteThings" TEXT,
    "closingMessage" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "donationAmountCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "permissionToPublish" BOOLEAN NOT NULL DEFAULT false,
    "permissionToAdvertise" BOOLEAN NOT NULL DEFAULT false,
    "submitterConfirmedRights" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PetMemorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetMemorialImage" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "assetId" TEXT,
    "version" INTEGER,
    "format" TEXT,
    "resourceType" TEXT DEFAULT 'image',
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "altText" TEXT,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PetMemorialImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorial_slug_key" ON "PetMemorial"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorial_stripeSessionId_key" ON "PetMemorial"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorial_stripePaymentIntentId_key" ON "PetMemorial"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorial_stripeChargeId_key" ON "PetMemorial"("stripeChargeId");

-- CreateIndex
CREATE INDEX "PetMemorial_status_idx" ON "PetMemorial"("status");

-- CreateIndex
CREATE INDEX "PetMemorial_ownerEmail_idx" ON "PetMemorial"("ownerEmail");

-- CreateIndex
CREATE INDEX "PetMemorial_createdAt_idx" ON "PetMemorial"("createdAt");

-- CreateIndex
CREATE INDEX "PetMemorial_publishedAt_idx" ON "PetMemorial"("publishedAt");

-- CreateIndex
CREATE INDEX "PetMemorial_deletedAt_idx" ON "PetMemorial"("deletedAt");

-- CreateIndex
CREATE INDEX "PetMemorial_status_publishedAt_idx" ON "PetMemorial"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorialImage_publicId_key" ON "PetMemorialImage"("publicId");

-- CreateIndex
CREATE INDEX "PetMemorialImage_memorialId_idx" ON "PetMemorialImage"("memorialId");

-- CreateIndex
CREATE INDEX "PetMemorialImage_memorialId_sortOrder_idx" ON "PetMemorialImage"("memorialId", "sortOrder");

-- CreateIndex
CREATE INDEX "PetMemorialImage_memorialId_isCover_idx" ON "PetMemorialImage"("memorialId", "isCover");

-- CreateIndex
CREATE INDEX "PetMemorialImage_deletedAt_idx" ON "PetMemorialImage"("deletedAt");

-- AddForeignKey
ALTER TABLE "PetMemorialImage" ADD CONSTRAINT "PetMemorialImage_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "PetMemorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
