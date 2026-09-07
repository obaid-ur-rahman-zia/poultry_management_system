import ShopCustomerController from "@/app/controllers/shop/shopCustomerController";

export async function GET(req) {
  return ShopCustomerController.getBalance(req);
}
