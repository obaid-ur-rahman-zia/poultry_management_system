import areaController from "@/app/controllers/area/areaController";

export async function GET() {
  return areaController.readUnassigned();
}
