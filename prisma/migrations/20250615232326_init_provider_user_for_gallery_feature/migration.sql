-- CreateTable
CREATE TABLE "ProviderGallery" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "publicId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderUser" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderGallery_publicId_key" ON "ProviderGallery"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderUser_clerkId_key" ON "ProviderUser"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderUser_email_key" ON "ProviderUser"("email");

-- AddForeignKey
ALTER TABLE "ProviderGallery" ADD CONSTRAINT "ProviderGallery_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
