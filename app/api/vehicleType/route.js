import vehicleTypeController from "@/app/controllers/vehicleType/vehicleTypeController";

export async function POST(req) {
  return vehicleTypeController.create(req);
}

export async function PUT(req) {
  return vehicleTypeController.update(req);
}
