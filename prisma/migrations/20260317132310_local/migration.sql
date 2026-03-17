-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "rate_one" DOUBLE PRECISION,
ADD COLUMN     "rate_three" DOUBLE PRECISION,
ADD COLUMN     "rate_two" DOUBLE PRECISION,
ADD COLUMN     "weight_one" DOUBLE PRECISION,
ADD COLUMN     "weight_three" DOUBLE PRECISION,
ADD COLUMN     "weight_two" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "local_sale" (
    "local_sale_id" SERIAL NOT NULL,
    "local_sale_date" TIMESTAMP(3) NOT NULL,
    "local_account" INTEGER NOT NULL,
    "purchaser_account" INTEGER NOT NULL,
    "purchaser_weight" DOUBLE PRECISION NOT NULL,
    "purchaser_rate" DOUBLE PRECISION NOT NULL,
    "purchaser_amount" DOUBLE PRECISION NOT NULL,
    "received_amount" DOUBLE PRECISION NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "local_sale_pkey" PRIMARY KEY ("local_sale_id")
);

-- AddForeignKey
ALTER TABLE "local_sale" ADD CONSTRAINT "local_sale_local_account_fkey" FOREIGN KEY ("local_account") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_sale" ADD CONSTRAINT "local_sale_purchaser_account_fkey" FOREIGN KEY ("purchaser_account") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;
