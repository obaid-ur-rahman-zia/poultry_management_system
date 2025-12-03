import SaleReportDownloadController from "@/app/controllers/sale/saleReport";

export async function GET(req) {
  return SaleReportDownloadController.readReport(req);
}

export const dynamic = "force-dynamic";
