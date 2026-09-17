import LocalSaleExpenseController from "@/app/controllers/localSaleExpense/localSaleExpenseController";

export async function GET(req) {
    return LocalSaleExpenseController.readAll(req);
}
