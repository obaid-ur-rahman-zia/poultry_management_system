-- CreateTable
CREATE TABLE "whole_sale" (
    "sale_id" SERIAL NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "fs_rate" DOUBLE PRECISION,
    "former_account" INTEGER NOT NULL,
    "van_number" VARCHAR(100) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "former_rate" DOUBLE PRECISION NOT NULL,
    "former_amount" DOUBLE PRECISION NOT NULL,
    "purcher_account" INTEGER NOT NULL,
    "purcher_rate" DOUBLE PRECISION,
    "purcher_amount" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "whole_sale_pkey" PRIMARY KEY ("sale_id")
);

-- CreateIndex
CREATE INDEX "whole_sale_former_account_idx" ON "whole_sale"("former_account");

-- CreateIndex
CREATE INDEX "whole_sale_purcher_account_idx" ON "whole_sale"("purcher_account");

-- CreateIndex
CREATE INDEX "whole_sale_sale_date_idx" ON "whole_sale"("sale_date");

-- AddForeignKey
ALTER TABLE "whole_sale" ADD CONSTRAINT "whole_sale_former_account_fkey" FOREIGN KEY ("former_account") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whole_sale" ADD CONSTRAINT "whole_sale_purcher_account_fkey" FOREIGN KEY ("purcher_account") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;
