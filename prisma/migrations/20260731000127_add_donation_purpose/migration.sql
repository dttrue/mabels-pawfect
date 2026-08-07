-- CreateEnum
CREATE TYPE "DonationPurpose" AS ENUM ('GENERAL', 'FOOD_LITTER', 'TOYS_ENRICHMENT', 'KITTEN_RESCUE', 'PREMIUM_RESCUE');

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "purpose" "DonationPurpose" NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE INDEX "Donation_purpose_idx" ON "Donation"("purpose");
