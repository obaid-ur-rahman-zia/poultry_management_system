/*
  Warnings:

  - You are about to drop the column `fs_rate` on the `whole_sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "whole_sale" DROP COLUMN "fs_rate",
ADD COLUMN     "farm_rate" DOUBLE PRECISION,
ADD COLUMN     "sale_rate" DOUBLE PRECISION;
