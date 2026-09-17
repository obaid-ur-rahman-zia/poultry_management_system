import ShopExpenseController from "@/app/controllers/shopExpense/shopExpenseController";

export async function GET(req) {
    return ShopExpenseController.readAllSubheads(req);
}

export async function POST(req) {
    return ShopExpenseController.createSubhead(req);
}

export async function PUT(req) {
    return ShopExpenseController.updateSubhead(req);
}

export async function DELETE(req) {
    return ShopExpenseController.deleteSubhead(req);
}
