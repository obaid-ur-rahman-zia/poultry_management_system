import FlocController from "@/app/controllers/floc/flocController";

export async function PUT(req) {
  return FlocController.clearEndingDate(req);
}

