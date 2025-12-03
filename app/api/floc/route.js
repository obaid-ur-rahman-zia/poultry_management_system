import FlocController from "@/app/controllers/floc/flocController";

export async function POST(req) {
  return FlocController.create(req);
}

export async function PUT(req) {
  return FlocController.update(req);
}

export async function DELETE(req) {
  return FlocController.delete(req);
}

