import ShopSaleController from "@/app/controllers/shop/shopSaleController";

export async function POST(req) {
  return ShopSaleController.create(req);
}

export async function PUT(req) {
  return ShopSaleController.update(req);
}

export async function DELETE(req) {
  return ShopSaleController.delete(req);
}
