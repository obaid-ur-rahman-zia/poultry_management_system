import ProductGroupController from "@/app/controllers/productGroup/productGroupController";

export async function GET() {
  return ProductGroupController.readAll();
}
