-- CreateTable
CREATE TABLE "stackholder" (
    "stackholder_id" SERIAL NOT NULL,
    "stackholder_nam" VARCHAR(100) NOT NULL,
    "stackholder_cnic" VARCHAR(100),
    "stackholder_contact" VARCHAR(50),
    "stackholder_address" VARCHAR(255),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "stackholder_pkey" PRIMARY KEY ("stackholder_id")
);

-- CreateTable
CREATE TABLE "floc_stackholder" (
    "floc_stackholder_id" SERIAL NOT NULL,
    "floc_id" INTEGER NOT NULL,
    "stackholder_id" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "floc_stackholder_pkey" PRIMARY KEY ("floc_stackholder_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stackholder_stackholder_nam_key" ON "stackholder"("stackholder_nam");

-- CreateIndex
CREATE UNIQUE INDEX "stackholder_stackholder_cnic_key" ON "stackholder"("stackholder_cnic");

-- CreateIndex
CREATE INDEX "stackholder_status_idx" ON "stackholder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_floc_stackholder" ON "floc_stackholder"("floc_id", "stackholder_id");

-- CreateIndex
CREATE INDEX "floc_stackholder_floc_id_idx" ON "floc_stackholder"("floc_id");

-- CreateIndex
CREATE INDEX "floc_stackholder_stackholder_id_idx" ON "floc_stackholder"("stackholder_id");

-- AddForeignKey
ALTER TABLE "floc_stackholder" ADD CONSTRAINT "floc_stackholder_floc_id_fkey" FOREIGN KEY ("floc_id") REFERENCES "floc"("floc_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floc_stackholder" ADD CONSTRAINT "floc_stackholder_stackholder_id_fkey" FOREIGN KEY ("stackholder_id") REFERENCES "stackholder"("stackholder_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "floc" DROP COLUMN "stackholders";

