-- AlterEnum
ALTER TYPE "PetMemorialUploadState" ADD VALUE 'CLOSED_NO_ASSET';

-- CreateEnum
CREATE TYPE "MemorialCheckoutAttemptState" AS ENUM ('CREATING', 'OPEN', 'COMPLETED', 'EXPIRED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "MemorialStripeEventState" AS ENUM ('PROCESSING', 'PROCESSED', 'IGNORED', 'REVIEW_REQUIRED');

-- CreateTable
CREATE TABLE "PetMemorialCheckoutAttempt" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "activeMemorialId" TEXT,
    "state" "MemorialCheckoutAttemptState" NOT NULL DEFAULT 'CREATING',
    "idempotencyKey" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "stripeSessionExpiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetMemorialCheckoutAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorialStripeEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "state" "MemorialStripeEventState" NOT NULL DEFAULT 'PROCESSING',
    "result" TEXT,
    "memorialId" TEXT,
    "checkoutAttemptId" TEXT,
    "stripeSessionId" TEXT,
    "stripeCreatedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemorialStripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorialCheckoutAttempt_activeMemorialId_key" ON "PetMemorialCheckoutAttempt"("activeMemorialId");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorialCheckoutAttempt_idempotencyKey_key" ON "PetMemorialCheckoutAttempt"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemorialCheckoutAttempt_stripeSessionId_key" ON "PetMemorialCheckoutAttempt"("stripeSessionId");

-- CreateIndex
CREATE INDEX "PetMemorialCheckoutAttempt_memorialId_state_idx" ON "PetMemorialCheckoutAttempt"("memorialId", "state");

-- CreateIndex
CREATE INDEX "PetMemorialCheckoutAttempt_state_stripeSessionExpiresAt_idx" ON "PetMemorialCheckoutAttempt"("state", "stripeSessionExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MemorialStripeEvent_stripeEventId_key" ON "MemorialStripeEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "MemorialStripeEvent_memorialId_createdAt_idx" ON "MemorialStripeEvent"("memorialId", "createdAt");

-- CreateIndex
CREATE INDEX "MemorialStripeEvent_checkoutAttemptId_idx" ON "MemorialStripeEvent"("checkoutAttemptId");

-- CreateIndex
CREATE INDEX "MemorialStripeEvent_state_createdAt_idx" ON "MemorialStripeEvent"("state", "createdAt");

-- AddForeignKey
ALTER TABLE "PetMemorialCheckoutAttempt" ADD CONSTRAINT "PetMemorialCheckoutAttempt_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "PetMemorial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorialStripeEvent" ADD CONSTRAINT "MemorialStripeEvent_checkoutAttemptId_fkey" FOREIGN KEY ("checkoutAttemptId") REFERENCES "PetMemorialCheckoutAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
