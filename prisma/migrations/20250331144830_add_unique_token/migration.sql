/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booking_token_key" ON "Booking"("token");
