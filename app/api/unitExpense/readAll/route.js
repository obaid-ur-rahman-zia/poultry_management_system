import UnitExpenseController from "@/app/controllers/unitExpense/unitExpenseController";

export async function GET() {
  return UnitExpenseController.readAll();
}

