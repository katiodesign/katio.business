-- AlterTable
ALTER TABLE "PaymentMilestone" ADD COLUMN     "receiptReference" TEXT;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "templateSnapshot" JSONB;

-- CreateTable
CREATE TABLE "QuotePayment" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "method" TEXT NOT NULL,
    "receiptReference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuotePayment_quoteId_key" ON "QuotePayment"("quoteId");

-- AddForeignKey
ALTER TABLE "QuotePayment" ADD CONSTRAINT "QuotePayment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
