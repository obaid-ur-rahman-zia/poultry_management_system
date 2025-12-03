import FarmController from "@/app/controllers/farm/farmController";

export async function GET(req) {
  return FarmController.readById(req);
}

