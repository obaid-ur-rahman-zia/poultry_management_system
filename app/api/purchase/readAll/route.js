import PurchaseController from "@/app/controllers/purchase/purchaseController";

export async function GET() {
  return PurchaseController.readAll();
}
