import SubareaController from "@/app/controllers/subarea/subareaController";

export async function POST(req) {
  return SubareaController.create(req);
}

export async function PUT(req) {
  return SubareaController.update(req);
}
