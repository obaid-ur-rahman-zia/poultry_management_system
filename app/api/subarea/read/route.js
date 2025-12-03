import SubareaController from "@/app/controllers/subarea/subareaController";

export async function GET(req) {
  return SubareaController.readByArea(req);
}
