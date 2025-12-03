import voucherController from "@/app/controllers/voucher/voucherController";

export async function GET() {
    return voucherController.readAll()
}