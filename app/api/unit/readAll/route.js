import UnitController from "@/app/controllers/unit/unitController";

export async function GET() {
  return UnitController.readAll();
}
