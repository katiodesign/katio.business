ALTER TABLE "Invoice" ALTER COLUMN "quoteId" DROP NOT NULL;
ALTER TABLE "Invoice" ADD COLUMN "subscriptionEventId" TEXT;
CREATE UNIQUE INDEX "Invoice_subscriptionEventId_key" ON "Invoice"("subscriptionEventId");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionEventId_fkey" FOREIGN KEY ("subscriptionEventId") REFERENCES "SubscriptionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_one_source_check" CHECK (("quoteId" IS NOT NULL)::int + ("subscriptionEventId" IS NOT NULL)::int = 1);
