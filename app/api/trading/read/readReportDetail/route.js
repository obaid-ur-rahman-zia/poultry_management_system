import TradingController from "@/app/controllers/trading/tradingController";

export async function GET(req) {
  return TradingController.readReportDetail(req);
}
