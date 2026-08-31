import oppositeTransactionController from "@/app/controllers/oppositeTransaction/oppositeTransactionController";

export async function GET(req) {
  return oppositeTransactionController.downloadBalanceSheet(req);
}

export const dynamic = "force-dynamic";
