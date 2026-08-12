import LocalSaleController from "@/app/controllers/localSale/localSaleController";

export async function GET(req) {
  return LocalSaleController.readProfitReport(req);
}
