import LocalSaleExpenseController from "@/app/controllers/localSaleExpense/localSaleExpenseController";

export async function GET(req) {
    return LocalSaleExpenseController.readAllSubheads(req);
}

export async function POST(req) {
    return LocalSaleExpenseController.createSubhead(req);
}

export async function PUT(req) {
    return LocalSaleExpenseController.updateSubhead(req);
}

export async function DELETE(req) {
    return LocalSaleExpenseController.deleteSubhead(req);
}
