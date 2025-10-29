-- AlterTable
ALTER TABLE "ContestEntry" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ContestEntry_contestId_deletedAt_idx" ON "ContestEntry"("contestId", "deletedAt");
