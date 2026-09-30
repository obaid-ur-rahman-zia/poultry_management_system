-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "account_opening_date" TIMESTAMP(3),
ADD COLUMN     "opening_balance" DOUBLE PRECISION DEFAULT 0;
