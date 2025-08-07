-- AlterTable
ALTER TABLE "Newsletter" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "publicId" TEXT;
