import AreaController from "@/app/controllers/area/areaController";

export async function GET() {
  return AreaController.readAll();
}
