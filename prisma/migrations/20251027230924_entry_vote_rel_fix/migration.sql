/*
  Warnings:

  - A unique constraint covering the columns `[entryId,ipHash]` on the table `ContestVote` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ContestVote_contestId_ipHash_key";

-- DropIndex
DROP INDEX "ContestVote_entryId_idx";

-- CreateIndex
CREATE INDEX "ContestVote_contestId_idx" ON "ContestVote"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestVote_entryId_ipHash_key" ON "ContestVote"("entryId", "ipHash");
