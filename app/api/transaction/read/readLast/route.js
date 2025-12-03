import transactionController from "@/app/controllers/transaction/transactionController";

export async function GET(req) {
  return transactionController.readLastTransaction(req);
}
