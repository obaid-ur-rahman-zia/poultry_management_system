import ShopCustomerController from "@/app/controllers/shop/shopCustomerController";

export async function GET(req) {
  return ShopCustomerController.readAll(req);
}

export async function POST(req) {
  return ShopCustomerController.create(req);
}
