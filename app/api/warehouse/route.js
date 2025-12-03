import WarehouseController from "@/app/controllers/warehouse/warehouseController";

export async function POST(req) {
  return WarehouseController.create(req);
}

export async function PUT(req) {
  return WarehouseController.update(req);
}
