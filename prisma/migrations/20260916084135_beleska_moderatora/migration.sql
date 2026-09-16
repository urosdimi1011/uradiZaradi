-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "moderatorNote" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
