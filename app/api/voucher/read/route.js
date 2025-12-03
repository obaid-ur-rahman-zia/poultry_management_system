import VoucherController from "@/app/controllers/voucher/voucherController";

export async function POST(req) {
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get("acc_id")

    return VoucherController.getByAccountId(accountId);
}
