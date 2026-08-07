-- CreateTable
CREATE TABLE "DonationItem" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "purpose" "DonationPurpose" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DonationItem_donationId_idx" ON "DonationItem"("donationId");

-- CreateIndex
CREATE INDEX "DonationItem_purpose_idx" ON "DonationItem"("purpose");

-- AddForeignKey
ALTER TABLE "DonationItem" ADD CONSTRAINT "DonationItem_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
