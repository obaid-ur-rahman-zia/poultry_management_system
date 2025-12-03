import FarmController from "@/app/controllers/farm/farmController";

export async function GET() {
  return FarmController.readAll();
}

