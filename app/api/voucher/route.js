
import voucherController from "@/app/controllers/voucher/voucherController";

export async function PUT(req) {
  return voucherController.update(req);
}

export async function POST(req) {
  return voucherController.create(req);
}

export async function DELETE(req) {
  return voucherController.delete(req);
}
