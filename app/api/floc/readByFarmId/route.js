import FlocController from "@/app/controllers/floc/flocController";

export async function GET(req) {
  return FlocController.readByFarmId(req);
}

