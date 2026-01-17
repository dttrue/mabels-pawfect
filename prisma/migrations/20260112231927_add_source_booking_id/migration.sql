/*
  Warnings:

  - A unique constraint covering the columns `[sourceBookingId]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "sourceBookingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_sourceBookingId_key" ON "Appointment"("sourceBookingId");
