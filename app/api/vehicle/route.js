import VehicleController from "@/app/controllers/vehicle/vehicleController";

export async function POST(req) {
  return VehicleController.create(req);
}

export async function PUT(req) {
  return VehicleController.update(req);
}
