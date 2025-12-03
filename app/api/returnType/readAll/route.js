import ReturnTypeController from "@/app/controllers/returnType/returnTypeController";

export async function GET() {
  return await ReturnTypeController.readAll();
}
