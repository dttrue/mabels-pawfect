/*
  Warnings:

  - Added the required column `entryId` to the `ContestVote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContestVote" ADD COLUMN     "entryId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ContestEntry_contestId_createdAt_idx" ON "ContestEntry"("contestId", "createdAt");

-- CreateIndex
CREATE INDEX "ContestVote_entryId_idx" ON "ContestVote"("entryId");

-- AddForeignKey
ALTER TABLE "ContestVote" ADD CONSTRAINT "ContestVote_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ContestEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
