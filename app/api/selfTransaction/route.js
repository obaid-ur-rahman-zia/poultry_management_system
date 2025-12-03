import SelfTransactionController from "@/app/controllers/selfTransaction/selfTransactionController";

export async function POST(req) {
  return SelfTransactionController.create(req);
}

export async function PUT(req) {
  return SelfTransactionController.update(req);
}

export async function DELETE(req) {
  return SelfTransactionController.delete(req);
}

