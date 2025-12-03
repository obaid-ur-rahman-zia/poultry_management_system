import VehicleController from "@/app/controllers/vehicle/vehicleController";

export async function GET(req) {
  return VehicleController.readById(req);
}
