import UnitExpenseController from "@/app/controllers/unitExpense/unitExpenseController";

export async function GET(req) {
  return UnitExpenseController.readReportDetail(req);
}
