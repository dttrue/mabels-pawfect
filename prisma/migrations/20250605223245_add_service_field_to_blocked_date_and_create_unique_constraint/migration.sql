/*
  Warnings:

  - You are about to drop the column `reason` on the `BlockedDate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[date,service]` on the table `BlockedDate` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BlockedDate_date_key";

-- AlterTable
ALTER TABLE "BlockedDate" DROP COLUMN "reason",
ADD COLUMN     "service" TEXT NOT NULL DEFAULT 'overnight';

-- CreateIndex
CREATE UNIQUE INDEX "BlockedDate_date_service_key" ON "BlockedDate"("date", "service");
