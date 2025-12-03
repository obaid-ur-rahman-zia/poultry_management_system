import PurchaseReturnController from "@/app/controllers/purchaseReturn/purchaseReturnController";

export async function GET() {
  return await PurchaseReturnController.readAll();
}
