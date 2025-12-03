import UnitExpenseController from "@/app/controllers/unitExpense/unitExpenseController";

export async function POST(req) {
  return UnitExpenseController.create(req);
}

export async function PUT(req) {
  return UnitExpenseController.update(req);
}

export async function DELETE(req) {
  return UnitExpenseController.delete(req);
}

