import SaleController from "@/app/controllers/sale/saleController";

export async function POST(req) {
  return SaleController.create(req);
}

export async function PUT(req) {
  return SaleController.update(req);
}
