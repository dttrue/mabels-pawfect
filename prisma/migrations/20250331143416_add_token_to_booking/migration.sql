/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `Booking` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Booking_token_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "expiresAt";
