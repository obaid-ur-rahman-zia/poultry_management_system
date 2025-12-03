-- CreateTable
CREATE TABLE "opposite_transaction" (
    "transaction_id" SERIAL NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "paid_by" INTEGER NOT NULL,
    "bank_account" INTEGER,
    "received_by" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(500),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "opposite_transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "self_transaction" (
    "transaction_id" SERIAL NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "is_bank" INTEGER NOT NULL DEFAULT 0,
    "account_id" INTEGER NOT NULL,
    "transaction_type" VARCHAR(20) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(500),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "self_transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateIndex
CREATE INDEX "opposite_transaction_paid_by_idx" ON "opposite_transaction"("paid_by");

-- CreateIndex
CREATE INDEX "opposite_transaction_received_by_idx" ON "opposite_transaction"("received_by");

-- CreateIndex
CREATE INDEX "opposite_transaction_transaction_date_idx" ON "opposite_transaction"("transaction_date");

-- CreateIndex
CREATE INDEX "self_transaction_account_id_idx" ON "self_transaction"("account_id");

-- CreateIndex
CREATE INDEX "self_transaction_transaction_date_idx" ON "self_transaction"("transaction_date");

-- CreateIndex
CREATE INDEX "self_transaction_transaction_type_idx" ON "self_transaction"("transaction_type");

-- AddForeignKey
ALTER TABLE "opposite_transaction" ADD CONSTRAINT "opposite_transaction_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opposite_transaction" ADD CONSTRAINT "opposite_transaction_bank_account_fkey" FOREIGN KEY ("bank_account") REFERENCES "accounts"("acc_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opposite_transaction" ADD CONSTRAINT "opposite_transaction_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_transaction" ADD CONSTRAINT "self_transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;
