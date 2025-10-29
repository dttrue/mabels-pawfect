/*
  Warnings:

  - A unique constraint covering the columns `[contestId,title]` on the table `ContestEntry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicId` to the `ContestEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContestEntry" ADD COLUMN     "publicId" TEXT NOT NULL,
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ContestEntry_contestId_title_key" ON "ContestEntry"("contestId", "title");
