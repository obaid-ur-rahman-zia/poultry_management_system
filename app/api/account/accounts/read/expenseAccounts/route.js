import accountsController from "@/app/controllers/account/accounts/accountsController";
export async function GET() {
    return accountsController.readExpenseAccounts();
}
