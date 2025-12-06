-- AlterTable
ALTER TABLE "unit_expense" ADD COLUMN     "supplier_id" INTEGER;

-- AlterTable
ALTER TABLE "unit_sale" ADD COLUMN     "customer_id" INTEGER;

-- CreateIndex
CREATE INDEX "unit_expense_supplier_id_idx" ON "unit_expense"("supplier_id");

-- CreateIndex
CREATE INDEX "unit_sale_customer_id_idx" ON "unit_sale"("customer_id");

-- AddForeignKey
ALTER TABLE "unit_expense" ADD CONSTRAINT "unit_expense_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "accounts"("acc_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_sale" ADD CONSTRAINT "unit_sale_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "accounts"("acc_id") ON DELETE SET NULL ON UPDATE CASCADE;
