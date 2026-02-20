-- CreateTable
CREATE TABLE "expense_transaction" (
    "expense_t_id" SERIAL NOT NULL,
    "expense_t_date" TIMESTAMP(3) NOT NULL,
    "account_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(500),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "expense_transaction_pkey" PRIMARY KEY ("expense_t_id")
);

-- CreateIndex
CREATE INDEX "expense_transaction_account_id_idx" ON "expense_transaction"("account_id");

-- CreateIndex
CREATE INDEX "expense_transaction_expense_t_date_idx" ON "expense_transaction"("expense_t_date");

-- AddForeignKey
ALTER TABLE "expense_transaction" ADD CONSTRAINT "expense_transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;
