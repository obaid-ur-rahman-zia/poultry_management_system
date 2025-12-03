import purchaseReturnController from "@/app/controllers/purchaseReturn/purchaseReturnController";

export async function POST(req) {
  return await purchaseReturnController.create(req);
}

export async function PUT(req) {
  return await purchaseReturnController.update(req);
}
