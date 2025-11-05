-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT;
