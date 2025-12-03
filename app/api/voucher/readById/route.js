import voucherController from "@/app/controllers/voucher/voucherController"

export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const voucherId = searchParams.get("voucher_id")
    const financial_year = searchParams.get("financial_year")

    return voucherController.getByVoucherId(voucherId, financial_year)
}