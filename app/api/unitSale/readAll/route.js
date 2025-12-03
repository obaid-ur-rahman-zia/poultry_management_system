import UnitSaleController from "@/app/controllers/unitSale/unitSaleController";

export async function GET() {
  return UnitSaleController.readAll();
}

