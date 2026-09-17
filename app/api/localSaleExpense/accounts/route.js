import LocalSaleExpenseController from "@/app/controllers/localSaleExpense/localSaleExpenseController";

export async function GET(req) {
    return LocalSaleExpenseController.readAllAccounts(req);
}

export async function POST(req) {
    return LocalSaleExpenseController.createAccount(req);
}

export async function PUT(req) {
    return LocalSaleExpenseController.updateAccount(req);
}

export async function DELETE(req) {
    return LocalSaleExpenseController.deleteAccount(req);
}
