import OppositeTransactionController from "@/app/controllers/oppositeTransaction/oppositeTransactionController";

export async function GET(req) {
  return OppositeTransactionController.readById(req);
}

