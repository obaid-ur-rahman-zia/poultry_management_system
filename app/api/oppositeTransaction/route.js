import OppositeTransactionController from "@/app/controllers/oppositeTransaction/oppositeTransactionController";

export async function POST(req) {
  return OppositeTransactionController.create(req);
}

export async function PUT(req) {
  return OppositeTransactionController.update(req);
}

export async function DELETE(req) {
  return OppositeTransactionController.delete(req);
}

