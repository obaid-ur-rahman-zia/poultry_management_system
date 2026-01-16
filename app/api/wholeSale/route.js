import WholeSaleController from "@/app/controllers/wholeSale/wholeSaleController";

export async function POST(req) {
  return WholeSaleController.create(req);
}

export async function PUT(req) {
  return WholeSaleController.update(req);
}

export async function DELETE(req) {
  return WholeSaleController.delete(req);
}
