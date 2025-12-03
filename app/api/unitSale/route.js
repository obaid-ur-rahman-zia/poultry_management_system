import UnitSaleController from "@/app/controllers/unitSale/unitSaleController";

export async function POST(req) {
  return UnitSaleController.create(req);
}

export async function PUT(req) {
  return UnitSaleController.update(req);
}

export async function DELETE(req) {
  return UnitSaleController.delete(req);
}

