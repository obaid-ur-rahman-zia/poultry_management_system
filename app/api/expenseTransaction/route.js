import ExpenseTransactionController from "@/app/controllers/expenseTransaction/expenseTransactionController";

// POST /api/expenseTransaction  — create
export async function POST(req) {
    return ExpenseTransactionController.create(req);
}

// PUT /api/expenseTransaction  — update
export async function PUT(req) {
    return ExpenseTransactionController.update(req);
}

export async function DELETE(req) {
    return ExpenseTransactionController.delete(req);
}