-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "ownerId" UUID;

-- CreateIndex
CREATE INDEX "Resume_ownerId_updatedAt_idx" ON "Resume"("ownerId", "updatedAt");
