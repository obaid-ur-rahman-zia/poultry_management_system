import FlocController from "@/app/controllers/floc/flocController";

export async function GET(req) {
  return FlocController.readById(req);
}

