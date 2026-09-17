import ShopExpenseController from "@/app/controllers/shopExpense/shopExpenseController";

export async function POST(req) {
    return ShopExpenseController.create(req);
}

export async function PUT(req) {
    return ShopExpenseController.update(req);
}

export async function DELETE(req) {
    return ShopExpenseController.delete(req);
}
