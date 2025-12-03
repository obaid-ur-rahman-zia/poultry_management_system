import vehicleTypeController from "@/app/controllers/vehicleType/vehicleTypeController";

export async function GET() {
  return vehicleTypeController.readAll();
}
