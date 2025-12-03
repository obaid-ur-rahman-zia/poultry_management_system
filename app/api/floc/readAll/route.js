import FlocController from "@/app/controllers/floc/flocController";

export async function GET() {
  return FlocController.readAll();
}

