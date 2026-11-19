CREATE TABLE "ExpensePayment" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "method" TEXT,
    "receiptReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpensePayment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ExpensePayment_expenseId_paidAt_idx" ON "ExpensePayment"("expenseId", "paidAt");
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "OperatingExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "ExpensePayment" ("id", "expenseId", "amount", "paidAt") SELECT 'legacy-' || "id", "id", "amount", "paidAt" FROM "OperatingExpense" WHERE "paidAt" IS NOT NULL;
