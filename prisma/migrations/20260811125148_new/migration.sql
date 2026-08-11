-- CreateTable
CREATE TABLE "bhagtanwala_source" (
    "source_id" SERIAL NOT NULL,
    "source_sale_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "source_date" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bhagtanwala_source_pkey" PRIMARY KEY ("source_id")
);

-- CreateTable
CREATE TABLE "local_sale_source_snapshot" (
    "snapshot_id" SERIAL NOT NULL,
    "local_sale_id" INTEGER NOT NULL,
    "source_id" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "local_sale_source_snapshot_pkey" PRIMARY KEY ("snapshot_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bhagtanwala_source_source_sale_id_key" ON "bhagtanwala_source"("source_sale_id");

-- CreateIndex
CREATE INDEX "bhagtanwala_source_account_id_source_date_status_idx" ON "bhagtanwala_source"("account_id", "source_date", "status");

-- CreateIndex
CREATE INDEX "local_sale_source_snapshot_local_sale_id_idx" ON "local_sale_source_snapshot"("local_sale_id");

-- CreateIndex
CREATE INDEX "local_sale_source_snapshot_source_id_idx" ON "local_sale_source_snapshot"("source_id");

-- AddForeignKey
ALTER TABLE "bhagtanwala_source" ADD CONSTRAINT "bhagtanwala_source_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bhagtanwala_source" ADD CONSTRAINT "bhagtanwala_source_source_sale_id_fkey" FOREIGN KEY ("source_sale_id") REFERENCES "whole_sale"("sale_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_sale_source_snapshot" ADD CONSTRAINT "local_sale_source_snapshot_local_sale_id_fkey" FOREIGN KEY ("local_sale_id") REFERENCES "local_sale"("local_sale_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_sale_source_snapshot" ADD CONSTRAINT "local_sale_source_snapshot_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "bhagtanwala_source"("source_id") ON DELETE RESTRICT ON UPDATE CASCADE;
