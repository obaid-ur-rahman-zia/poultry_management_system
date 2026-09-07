import ShopClosingStockController from "@/app/controllers/shop/shopClosingStockController";

export async function GET(req) {
  return ShopClosingStockController.getStock(req);
}
