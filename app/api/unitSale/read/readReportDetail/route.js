import UnitSaleController from "@/app/controllers/unitSale/unitSaleController";

export async function GET(req) {
  return UnitSaleController.readReportDetail(req);
}
