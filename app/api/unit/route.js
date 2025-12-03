import UnitController from "@/app/controllers/unit/unitController";

export async function POST(req) {
  return UnitController.create(req);
}

export async function PUT(req) {
  return UnitController.update(req);
}
