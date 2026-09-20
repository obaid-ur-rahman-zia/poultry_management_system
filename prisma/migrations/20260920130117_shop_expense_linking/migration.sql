-- AlterTable
ALTER TABLE "shop_expense" ADD COLUMN     "shop_acc_id" INTEGER;

-- CreateIndex
CREATE INDEX "shop_expense_shop_acc_id_idx" ON "shop_expense"("shop_acc_id");

-- AddForeignKey
ALTER TABLE "shop_expense" ADD CONSTRAINT "shop_expense_shop_acc_id_fkey" FOREIGN KEY ("shop_acc_id") REFERENCES "accounts"("acc_id") ON DELETE SET NULL ON UPDATE CASCADE;
