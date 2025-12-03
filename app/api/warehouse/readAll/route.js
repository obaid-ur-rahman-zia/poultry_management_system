import WarehouseController from "@/app/controllers/warehouse/warehouseController";

export async function GET() {
  return WarehouseController.readAll();
}
