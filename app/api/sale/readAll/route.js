import SaleController from "@/app/controllers/sale/saleController";

export async function GET() {
  return SaleController.readAll();
}
