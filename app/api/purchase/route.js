import PurchaseController from "@/app/controllers/purchase/purchaseController";

export async function POST(req) {
  return PurchaseController.create(req);
}

export async function PUT(req) {
  return PurchaseController.update(req);
}
