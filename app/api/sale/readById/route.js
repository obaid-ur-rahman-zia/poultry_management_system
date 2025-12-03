import SaleController from "@/app/controllers/sale/saleController";

export async function GET(req) {
  return SaleController.readById(req);
}
