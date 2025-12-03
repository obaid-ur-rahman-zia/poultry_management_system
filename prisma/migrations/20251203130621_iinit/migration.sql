-- CreateTable
CREATE TABLE "unit_expense" (
    "expense_id" SERIAL NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "floc_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "tax_type" VARCHAR(20) NOT NULL,
    "tax_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_type" VARCHAR(20) NOT NULL,
    "discount_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(500),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "unit_expense_pkey" PRIMARY KEY ("expense_id")
);

-- CreateTable
CREATE TABLE "unit_sale" (
    "sale_id" SERIAL NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "floc_id" INTEGER NOT NULL,
    "farm_rate" DOUBLE PRECISION,
    "sale_rate" DOUBLE PRECISION,
    "product_id" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "tax_type" VARCHAR(20) NOT NULL,
    "tax_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_type" VARCHAR(20) NOT NULL,
    "discount_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(500),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "unit_sale_pkey" PRIMARY KEY ("sale_id")
);

-- CreateTable
CREATE TABLE "daily_fs_rate" (
    "rate_id" SERIAL NOT NULL,
    "rate_date" TIMESTAMP(3) NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "floc_id" INTEGER NOT NULL,
    "farm_rate" DOUBLE PRECISION NOT NULL,
    "sale_rate" DOUBLE PRECISION NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "daily_fs_rate_pkey" PRIMARY KEY ("rate_id")
);

-- CreateIndex
CREATE INDEX "unit_expense_farm_id_idx" ON "unit_expense"("farm_id");

-- CreateIndex
CREATE INDEX "unit_expense_floc_id_idx" ON "unit_expense"("floc_id");

-- CreateIndex
CREATE INDEX "unit_expense_product_id_idx" ON "unit_expense"("product_id");

-- CreateIndex
CREATE INDEX "unit_expense_expense_date_idx" ON "unit_expense"("expense_date");

-- CreateIndex
CREATE INDEX "unit_sale_farm_id_idx" ON "unit_sale"("farm_id");

-- CreateIndex
CREATE INDEX "unit_sale_floc_id_idx" ON "unit_sale"("floc_id");

-- CreateIndex
CREATE INDEX "unit_sale_product_id_idx" ON "unit_sale"("product_id");

-- CreateIndex
CREATE INDEX "unit_sale_sale_date_idx" ON "unit_sale"("sale_date");

-- CreateIndex
CREATE UNIQUE INDEX "unit_sale_farm_id_floc_id_sale_date_key" ON "unit_sale"("farm_id", "floc_id", "sale_date");

-- CreateIndex
CREATE INDEX "daily_fs_rate_farm_id_idx" ON "daily_fs_rate"("farm_id");

-- CreateIndex
CREATE INDEX "daily_fs_rate_floc_id_idx" ON "daily_fs_rate"("floc_id");

-- CreateIndex
CREATE INDEX "daily_fs_rate_rate_date_idx" ON "daily_fs_rate"("rate_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_fs_rate_farm_id_floc_id_rate_date_key" ON "daily_fs_rate"("farm_id", "floc_id", "rate_date");

-- AddForeignKey
ALTER TABLE "unit_expense" ADD CONSTRAINT "unit_expense_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farm"("farm_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_expense" ADD CONSTRAINT "unit_expense_floc_id_fkey" FOREIGN KEY ("floc_id") REFERENCES "floc"("floc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_expense" ADD CONSTRAINT "unit_expense_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_sale" ADD CONSTRAINT "unit_sale_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farm"("farm_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_sale" ADD CONSTRAINT "unit_sale_floc_id_fkey" FOREIGN KEY ("floc_id") REFERENCES "floc"("floc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_sale" ADD CONSTRAINT "unit_sale_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_fs_rate" ADD CONSTRAINT "daily_fs_rate_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farm"("farm_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_fs_rate" ADD CONSTRAINT "daily_fs_rate_floc_id_fkey" FOREIGN KEY ("floc_id") REFERENCES "floc"("floc_id") ON DELETE RESTRICT ON UPDATE CASCADE;
