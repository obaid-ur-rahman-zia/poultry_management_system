import SelfTransactionController from "@/app/controllers/selfTransaction/selfTransactionController";

export async function GET() {
  return SelfTransactionController.readAll();
}

