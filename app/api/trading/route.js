import TradingController from "@/app/controllers/trading/tradingController";

export async function POST(req) {
  return TradingController.create(req);
}

export async function PUT(req) {
  return TradingController.update(req);
}

export async function DELETE(req) {
  return TradingController.delete(req);
}

