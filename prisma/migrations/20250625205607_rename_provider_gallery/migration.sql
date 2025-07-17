/*
  Warnings:

  - You are about to drop the column `providerId` on the `ProviderGallery` table. All the data in the column will be lost.
  - You are about to drop the `ProviderUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProviderGallery" DROP CONSTRAINT "ProviderGallery_providerId_fkey";

-- AlterTable
ALTER TABLE "ProviderGallery" DROP COLUMN "providerId";

-- DropTable
DROP TABLE "ProviderUser";
