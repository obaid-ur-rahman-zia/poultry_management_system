import WholeSaleController from "@/app/controllers/wholeSale/wholeSaleController";

export async function GET(req) {
  return WholeSaleController.readById(req);
}
