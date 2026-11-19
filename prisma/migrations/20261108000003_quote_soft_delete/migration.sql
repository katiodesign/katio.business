ALTER TABLE "Quote" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Quote_deletedAt_createdAt_idx" ON "Quote"("deletedAt", "createdAt");
