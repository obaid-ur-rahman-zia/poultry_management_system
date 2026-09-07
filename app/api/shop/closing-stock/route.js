import ShopClosingStockController from "@/app/controllers/shop/shopClosingStockController";

export async function GET(req) {
  return ShopClosingStockController.readAll(req);
}

export async function POST(req) {
  return ShopClosingStockController.upsert(req);
}
