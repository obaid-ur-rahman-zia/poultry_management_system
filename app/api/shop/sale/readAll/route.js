import ShopSaleController from "@/app/controllers/shop/shopSaleController";

export async function GET(req) {
  return ShopSaleController.readAll(req);
}
