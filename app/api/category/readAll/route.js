import CategoryController from "@/app/controllers/category/categoryController";

export async function GET() {
  return CategoryController.readAll();
}
