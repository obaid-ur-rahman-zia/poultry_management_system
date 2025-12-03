import voucherController from "@/app/controllers/voucher/voucherController";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const financialYear = searchParams.get("financial_year")

    return voucherController.getNextVoucherId(financialYear)
    
}