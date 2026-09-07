-- CreateTable
CREATE TABLE "shop_customer" (
    "customer_id" SERIAL NOT NULL,
    "customer_nam" VARCHAR(100) NOT NULL,
    "customer_contact" VARCHAR(50),
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "shop_customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "shop_sale" (
    "shop_sale_id" SERIAL NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "shop_acc_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "previous_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "received_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "shop_sale_pkey" PRIMARY KEY ("shop_sale_id")
);

-- CreateTable
CREATE TABLE "shop_closing_stock" (
    "closing_id" SERIAL NOT NULL,
    "closing_date" TIMESTAMP(3) NOT NULL,
    "shop_acc_id" INTEGER NOT NULL,
    "closing_weight" DOUBLE PRECISION NOT NULL,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "shop_closing_stock_pkey" PRIMARY KEY ("closing_id")
);

-- CreateIndex
CREATE INDEX "shop_customer_status_idx" ON "shop_customer"("status");

-- CreateIndex
CREATE INDEX "shop_sale_sale_date_idx" ON "shop_sale"("sale_date");

-- CreateIndex
CREATE INDEX "shop_sale_shop_acc_id_idx" ON "shop_sale"("shop_acc_id");

-- CreateIndex
CREATE INDEX "shop_sale_customer_id_idx" ON "shop_sale"("customer_id");

-- CreateIndex
CREATE INDEX "shop_sale_status_idx" ON "shop_sale"("status");

-- CreateIndex
CREATE INDEX "shop_closing_stock_shop_acc_id_idx" ON "shop_closing_stock"("shop_acc_id");

-- CreateIndex
CREATE INDEX "shop_closing_stock_closing_date_idx" ON "shop_closing_stock"("closing_date");

-- CreateIndex
CREATE INDEX "shop_closing_stock_status_idx" ON "shop_closing_stock"("status");

-- AddForeignKey
ALTER TABLE "shop_sale" ADD CONSTRAINT "shop_sale_shop_acc_id_fkey" FOREIGN KEY ("shop_acc_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_sale" ADD CONSTRAINT "shop_sale_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "shop_customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_closing_stock" ADD CONSTRAINT "shop_closing_stock_shop_acc_id_fkey" FOREIGN KEY ("shop_acc_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;
