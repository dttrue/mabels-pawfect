/*
  Warnings:

  - Added the required column `name` to the `ProviderUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProviderUser" ADD COLUMN     "name" TEXT NOT NULL;
