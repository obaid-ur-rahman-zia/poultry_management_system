import transactionController from "@/app/controllers/transaction/transactionController";

export async function GET() {
    return transactionController.readAll()
}