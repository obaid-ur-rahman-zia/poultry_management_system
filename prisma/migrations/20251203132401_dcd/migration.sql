-- CreateTable
CREATE TABLE "trading" (
    "trading_id" SERIAL NOT NULL,
    "trading_date" TIMESTAMP(3) NOT NULL,
    "buy_from_account" INTEGER NOT NULL,
    "do_number" VARCHAR(100),
    "product_id" INTEGER NOT NULL,
    "buy_quantity" DOUBLE PRECISION NOT NULL,
    "buy_price" DOUBLE PRECISION NOT NULL,
    "buy_tax_type" VARCHAR(20) NOT NULL,
    "buy_tax_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buy_discount_type" VARCHAR(20) NOT NULL,
    "buy_discount_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buy_total" DOUBLE PRECISION NOT NULL,
    "buy_detail" VARCHAR(500),
    "sale_to_account" INTEGER NOT NULL,
    "sale_price" DOUBLE PRECISION NOT NULL,
    "sale_quantity" DOUBLE PRECISION NOT NULL,
    "sale_tax_type" VARCHAR(20) NOT NULL,
    "sale_tax_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sale_discount_type" VARCHAR(20) NOT NULL,
    "sale_discount_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sale_total" DOUBLE PRECISION NOT NULL,
    "sale_detail" VARCHAR(500),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "trading_pkey" PRIMARY KEY ("trading_id")
);

-- CreateIndex
CREATE INDEX "trading_buy_from_account_idx" ON "trading"("buy_from_account");

-- CreateIndex
CREATE INDEX "trading_sale_to_account_idx" ON "trading"("sale_to_account");

-- CreateIndex
CREATE INDEX "trading_product_id_idx" ON "trading"("product_id");

-- CreateIndex
CREATE INDEX "trading_trading_date_idx" ON "trading"("trading_date");

-- AddForeignKey
ALTER TABLE "trading" ADD CONSTRAINT "trading_buy_from_account_fkey" FOREIGN KEY ("buy_from_account") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading" ADD CONSTRAINT "trading_sale_to_account_fkey" FOREIGN KEY ("sale_to_account") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading" ADD CONSTRAINT "trading_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
