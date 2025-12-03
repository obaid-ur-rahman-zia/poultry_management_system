import FarmController from "@/app/controllers/farm/farmController";

export async function POST(req) {
  return FarmController.create(req);
}

export async function PUT(req) {
  return FarmController.update(req);
}

export async function DELETE(req) {
  return FarmController.delete(req);
}

