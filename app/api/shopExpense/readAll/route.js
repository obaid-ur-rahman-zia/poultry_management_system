import ShopExpenseController from "@/app/controllers/shopExpense/shopExpenseController";

export async function GET(req) {
    return ShopExpenseController.readAll(req);
}
