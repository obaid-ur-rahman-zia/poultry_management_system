-- CreateTable
CREATE TABLE "local_sale_expense_subhead" (
    "ls_subhead_id" SERIAL NOT NULL,
    "subhead_nam" VARCHAR(100) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "local_sale_expense_subhead_pkey" PRIMARY KEY ("ls_subhead_id")
);

-- CreateTable
CREATE TABLE "local_sale_expense_account" (
    "ls_account_id" SERIAL NOT NULL,
    "ls_subhead_id" INTEGER NOT NULL,
    "account_nam" VARCHAR(100) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "local_sale_expense_account_pkey" PRIMARY KEY ("ls_account_id")
);

-- CreateTable
CREATE TABLE "local_sale_expense" (
    "ls_expense_id" SERIAL NOT NULL,
    "ls_expense_date" TIMESTAMP(3) NOT NULL,
    "ls_account_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(500),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "local_sale_expense_pkey" PRIMARY KEY ("ls_expense_id")
);

-- CreateTable
CREATE TABLE "shop_expense_subhead" (
    "shop_subhead_id" SERIAL NOT NULL,
    "subhead_nam" VARCHAR(100) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "shop_expense_subhead_pkey" PRIMARY KEY ("shop_subhead_id")
);

-- CreateTable
CREATE TABLE "shop_expense_account" (
    "shop_account_id" SERIAL NOT NULL,
    "shop_subhead_id" INTEGER NOT NULL,
    "account_nam" VARCHAR(100) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "shop_expense_account_pkey" PRIMARY KEY ("shop_account_id")
);

-- CreateTable
CREATE TABLE "shop_expense" (
    "shop_expense_id" SERIAL NOT NULL,
    "shop_expense_date" TIMESTAMP(3) NOT NULL,
    "shop_account_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(500),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "shop_expense_pkey" PRIMARY KEY ("shop_expense_id")
);

-- CreateIndex
CREATE INDEX "local_sale_expense_account_ls_subhead_id_idx" ON "local_sale_expense_account"("ls_subhead_id");

-- CreateIndex
CREATE INDEX "local_sale_expense_ls_account_id_idx" ON "local_sale_expense"("ls_account_id");

-- CreateIndex
CREATE INDEX "local_sale_expense_ls_expense_date_idx" ON "local_sale_expense"("ls_expense_date");

-- CreateIndex
CREATE INDEX "shop_expense_account_shop_subhead_id_idx" ON "shop_expense_account"("shop_subhead_id");

-- CreateIndex
CREATE INDEX "shop_expense_shop_account_id_idx" ON "shop_expense"("shop_account_id");

-- CreateIndex
CREATE INDEX "shop_expense_shop_expense_date_idx" ON "shop_expense"("shop_expense_date");

-- AddForeignKey
ALTER TABLE "local_sale_expense_account" ADD CONSTRAINT "local_sale_expense_account_ls_subhead_id_fkey" FOREIGN KEY ("ls_subhead_id") REFERENCES "local_sale_expense_subhead"("ls_subhead_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_sale_expense" ADD CONSTRAINT "local_sale_expense_ls_account_id_fkey" FOREIGN KEY ("ls_account_id") REFERENCES "local_sale_expense_account"("ls_account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_expense_account" ADD CONSTRAINT "shop_expense_account_shop_subhead_id_fkey" FOREIGN KEY ("shop_subhead_id") REFERENCES "shop_expense_subhead"("shop_subhead_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_expense" ADD CONSTRAINT "shop_expense_shop_account_id_fkey" FOREIGN KEY ("shop_account_id") REFERENCES "shop_expense_account"("shop_account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
