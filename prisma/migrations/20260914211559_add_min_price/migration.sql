-- DropIndex
DROP INDEX "Majstor_searchText_trgm_idx";

-- AlterTable
ALTER TABLE "Majstor" ADD COLUMN     "minPriceMinor" INTEGER;

-- CreateIndex
CREATE INDEX "Majstor_status_minPriceMinor_idx" ON "Majstor"("status", "minPriceMinor");
