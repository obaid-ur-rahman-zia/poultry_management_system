import oppositeTransactionController from "@/app/controllers/oppositeTransaction/oppositeTransactionController";

export async function GET(req) {
  return oppositeTransactionController.readBalanceSheet(req);
}
