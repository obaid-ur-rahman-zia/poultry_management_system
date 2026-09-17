import LocalSaleExpenseController from "@/app/controllers/localSaleExpense/localSaleExpenseController";

export async function POST(req) {
    return LocalSaleExpenseController.create(req);
}

export async function PUT(req) {
    return LocalSaleExpenseController.update(req);
}

export async function DELETE(req) {
    return LocalSaleExpenseController.delete(req);
}
