import areaController from "@/app/controllers/area/areaController";

export async function PUT(req) {
  return areaController.update(req);
}

export async function POST(req) {
  return areaController.create(req);
}
