-- CreateEnum
CREATE TYPE "PriceUnit" AS ENUM ('M2', 'M1', 'SAT', 'DAN', 'KOMAD', 'PO_DOGOVORU');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('RSD');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MAJSTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('NONE', 'EMAIL', 'PHONE', 'IDENTITY');

-- CreateEnum
CREATE TYPE "MajstorStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "MajstorBadge" AS ENUM ('PRO_TOOLS', 'WARRANTY', 'INVOICE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PromotionPlacement" AS ENUM ('HOME', 'CATEGORY', 'CATEGORY_CITY', 'SEARCH');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameLatn" TEXT NOT NULL,
    "nameCyrl" TEXT NOT NULL,
    "nameLocativeLatn" TEXT NOT NULL,
    "nameLocativeCyrl" TEXT NOT NULL,
    "regionLatn" TEXT NOT NULL,
    "regionCyrl" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "population" INTEGER NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Municipality" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameLatn" TEXT NOT NULL,
    "nameCyrl" TEXT NOT NULL,

    CONSTRAINT "Municipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameLatn" TEXT NOT NULL,
    "nameCyrl" TEXT NOT NULL,
    "nameSingularLatn" TEXT NOT NULL,
    "nameSingularCyrl" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "introLatn" TEXT NOT NULL,
    "introCyrl" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nameLatn" TEXT NOT NULL,
    "nameCyrl" TEXT NOT NULL,
    "defaultUnit" "PriceUnit" NOT NULL,
    "allowedUnits" "PriceUnit"[],
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTypeProposal" (
    "id" TEXT NOT NULL,
    "majstorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "proposedName" TEXT NOT NULL,
    "proposedUnit" "PriceUnit" NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceTypeProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Majstor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "primaryCategoryId" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "cityId" TEXT NOT NULL,
    "municipalityId" TEXT,
    "phone" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "badges" "MajstorBadge"[],
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'NONE',
    "status" "MajstorStatus" NOT NULL DEFAULT 'DRAFT',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "searchText" TEXT NOT NULL DEFAULT '',
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "ratingBayesian" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingDist1" INTEGER NOT NULL DEFAULT 0,
    "ratingDist2" INTEGER NOT NULL DEFAULT 0,
    "ratingDist3" INTEGER NOT NULL DEFAULT 0,
    "ratingDist4" INTEGER NOT NULL DEFAULT 0,
    "ratingDist5" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Majstor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MajstorCategory" (
    "majstorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "MajstorCategory_pkey" PRIMARY KEY ("majstorId","categoryId")
);

-- CreateTable
CREATE TABLE "MajstorCity" (
    "majstorId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "MajstorCity_pkey" PRIMARY KEY ("majstorId","cityId")
);

-- CreateTable
CREATE TABLE "MajstorService" (
    "id" TEXT NOT NULL,
    "majstorId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "priceFromMinor" INTEGER,
    "currency" "Currency" NOT NULL DEFAULT 'RSD',
    "unit" "PriceUnit" NOT NULL,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MajstorService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkPhoto" (
    "id" TEXT NOT NULL,
    "majstorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MajstorStats" (
    "majstorId" TEXT NOT NULL,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "phoneReveals" INTEGER NOT NULL DEFAULT 0,
    "messageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MajstorStats_pkey" PRIMARY KEY ("majstorId")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "majstorId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorDisplayName" TEXT NOT NULL,
    "authorAvatarUrl" TEXT,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "serviceTypeId" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "replyBody" TEXT,
    "replyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderatedAt" TIMESTAMP(3),
    "moderatorId" TEXT,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedMajstor" (
    "id" TEXT NOT NULL,
    "majstorId" TEXT NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedMajstor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "majstorId" TEXT NOT NULL,
    "placement" "PromotionPlacement" NOT NULL,
    "categoryId" TEXT,
    "cityId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "pricePaidMinor" INTEGER,
    "pricePaidCurrency" "Currency",
    "status" "PromotionStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "City_population_idx" ON "City"("population" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Municipality_cityId_slug_key" ON "Municipality"("cityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_slug_key" ON "ServiceType"("slug");

-- CreateIndex
CREATE INDEX "ServiceType_categoryId_sortOrder_idx" ON "ServiceType"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "ServiceTypeProposal_status_createdAt_idx" ON "ServiceTypeProposal"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Majstor_slug_key" ON "Majstor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Majstor_userId_key" ON "Majstor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Majstor_phone_key" ON "Majstor"("phone");

-- CreateIndex
CREATE INDEX "Majstor_status_cityId_idx" ON "Majstor"("status", "cityId");

-- CreateIndex
CREATE INDEX "Majstor_status_primaryCategoryId_idx" ON "Majstor"("status", "primaryCategoryId");

-- CreateIndex
CREATE INDEX "Majstor_status_ratingBayesian_idx" ON "Majstor"("status", "ratingBayesian" DESC);

-- CreateIndex
CREATE INDEX "Majstor_status_createdAt_idx" ON "Majstor"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MajstorCategory_categoryId_idx" ON "MajstorCategory"("categoryId");

-- CreateIndex
CREATE INDEX "MajstorCity_cityId_idx" ON "MajstorCity"("cityId");

-- CreateIndex
CREATE INDEX "MajstorService_serviceTypeId_idx" ON "MajstorService"("serviceTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "MajstorService_majstorId_serviceTypeId_key" ON "MajstorService"("majstorId", "serviceTypeId");

-- CreateIndex
CREATE INDEX "WorkPhoto_majstorId_sortOrder_idx" ON "WorkPhoto"("majstorId", "sortOrder");

-- CreateIndex
CREATE INDEX "Review_majstorId_status_createdAt_idx" ON "Review"("majstorId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_majstorId_authorUserId_key" ON "Review"("majstorId", "authorUserId");

-- CreateIndex
CREATE INDEX "SavedMajstor_deviceId_createdAt_idx" ON "SavedMajstor"("deviceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SavedMajstor_userId_createdAt_idx" ON "SavedMajstor"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SavedMajstor_userId_majstorId_key" ON "SavedMajstor"("userId", "majstorId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedMajstor_deviceId_majstorId_key" ON "SavedMajstor"("deviceId", "majstorId");

-- CreateIndex
CREATE INDEX "Promotion_status_placement_priority_idx" ON "Promotion"("status", "placement", "priority" DESC);

-- CreateIndex
CREATE INDEX "Promotion_majstorId_idx" ON "Promotion"("majstorId");

-- AddForeignKey
ALTER TABLE "Municipality" ADD CONSTRAINT "Municipality_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceType" ADD CONSTRAINT "ServiceType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTypeProposal" ADD CONSTRAINT "ServiceTypeProposal_majstorId_fkey" FOREIGN KEY ("majstorId") REFERENCES "Majstor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTypeProposal" ADD CONSTRAINT "ServiceTypeProposal_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Majstor" ADD CONSTRAINT "Majstor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Majstor" ADD CONSTRAINT "Majstor_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Majstor" ADD CONSTRAINT "Majstor_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Majstor" ADD CONSTRAINT "Majstor_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajstorCategory" ADD CONSTRAINT "MajstorCategory_majstorId_fkey" FOREIGN KEY ("majstorId") REFERENCES "Majstor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajstorCategory" ADD CONSTRAINT "MajstorCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajstorCity" ADD CONSTRAINT "MajstorCity_majstorId_fkey" FOREIGN KEY ("majstorId") REFERENCES "Majstor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajstorCity" ADD CONSTRAINT "MajstorCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajstorService" ADD CONSTRAINT "MajstorService_majstorId_fkey" FOREIGN KEY ("majstorId") REFERENCES "Majstor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajstorService" ADD CONSTRAINT "MajstorService_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPhoto" ADD CONSTRAINT "WorkPhoto_majstorId_fkey" FOREIGN KEY ("majstorId") REFERENCES "Majstor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajstorStats" ADD CONSTRAINT "MajstorStats_majstorId_fkey" FOREIGN KEY ("majstorId") REFERENCES "Majstor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_majstorId_fkey" FOREIGN KEY ("majstorId") REFERENCES "Majstor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedMajstor" ADD CONSTRAINT "SavedMajstor_majstorId_fkey" FOREIGN KEY ("majstorId") REFERENCES "Majstor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedMajstor" ADD CONSTRAINT "SavedMajstor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_majstorId_fkey" FOREIGN KEY ("majstorId") REFERENCES "Majstor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
