import SaleReturnController from "@/app/controllers/saleReturn/saleReturnController";

export async function GET(req) {
  return SaleReturnController.readAll(req);
}
