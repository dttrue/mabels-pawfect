-- CreateEnum
CREATE TYPE "GalleryCategory" AS ENUM ('HAPPY', 'MEMORIAM');

-- AlterTable
ALTER TABLE "ProviderGallery" ADD COLUMN     "category" "GalleryCategory" NOT NULL DEFAULT 'HAPPY';
