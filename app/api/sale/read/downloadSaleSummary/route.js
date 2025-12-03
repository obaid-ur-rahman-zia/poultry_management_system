import SaleReportController from "@/app/controllers/sale/saleReport";

export async function GET(req) {
  return SaleReportController.readSummary(req);
}

export const dynamic = "force-dynamic";
