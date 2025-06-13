/*
  Warnings:

  - You are about to drop the column `date` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "date",
ADD COLUMN     "entries" JSONB;
