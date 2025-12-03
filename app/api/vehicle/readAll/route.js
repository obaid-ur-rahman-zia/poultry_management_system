import VehicleController from "@/app/controllers/vehicle/vehicleController";

export async function GET() {
  return VehicleController.readAll();
}
