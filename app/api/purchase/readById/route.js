import PurchaseController from "@/app/controllers/purchase/purchaseController";

export async function GET(req) {
  return PurchaseController.readById(req);
}
