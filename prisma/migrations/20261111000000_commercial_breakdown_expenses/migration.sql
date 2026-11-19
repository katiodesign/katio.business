ALTER TABLE "Quote" ADD COLUMN "showBreakdown" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "QuoteLine" ADD COLUMN "commercialComponents" JSONB;
ALTER TABLE "OperatingExpense" ADD COLUMN "deletedAt" TIMESTAMP(3);
