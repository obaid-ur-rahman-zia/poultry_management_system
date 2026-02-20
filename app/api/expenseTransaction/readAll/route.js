import ExpenseTransactionController from "@/app/controllers/expenseTransaction/expenseTransactionController";

export async function GET(req) {
    return ExpenseTransactionController.readAll(req);
}
