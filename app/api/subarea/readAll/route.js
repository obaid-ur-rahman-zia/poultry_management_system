import SubareaController from "@/app/controllers/subarea/subareaController";

export async function GET() {
  return SubareaController.readAll();
}
