import TransactionController from "@/app/controllers/transaction/transactionController";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("acc_id");
    
    return TransactionController.getAccountBalance(accountId)
}
