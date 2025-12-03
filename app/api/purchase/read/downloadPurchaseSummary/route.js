import PurchaseReportDownloadController from "@/app/controllers/purchase/purchaseReport";

export async function GET(req) {
  return PurchaseReportDownloadController.readSummary(req);
}

export const dynamic = "force-dynamic";
