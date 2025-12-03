import PurchaseReturnController from "@/app/controllers/purchaseReturn/purchaseReturnController";

export async function GET(req) {
  return PurchaseReturnController.readById(req);
}