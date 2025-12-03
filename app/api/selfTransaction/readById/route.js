import SelfTransactionController from "@/app/controllers/selfTransaction/selfTransactionController";

export async function GET(req) {
  return SelfTransactionController.readById(req);
}

