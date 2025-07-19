-- AlterTable
ALTER TABLE "ProviderGallery" ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
