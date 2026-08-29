import WholeSaleController from "@/app/controllers/wholeSale/wholeSaleController";

export async function PUT(req) {
  return WholeSaleController.updateFsRate(req);
}
