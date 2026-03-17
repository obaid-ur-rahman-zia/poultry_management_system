import LocalSaleController from "@/app/controllers/localSale/localSaleController";

export async function POST(req) {
  return LocalSaleController.create(req);
}

export async function PUT(req) {
  return LocalSaleController.update(req);
}

export async function DELETE(req) {
  return LocalSaleController.delete(req);
}
