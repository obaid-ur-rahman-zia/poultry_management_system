import OppositeTransactionController from "@/app/controllers/oppositeTransaction/oppositeTransactionController";

export async function GET() {
  return OppositeTransactionController.readAll();
}

