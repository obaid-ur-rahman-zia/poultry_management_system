import CategoryController from "@/app/controllers/category/categoryController";

export async function POST(req) {
  return CategoryController.create(req);
}

export async function PUT(req) {
  return CategoryController.update(req);
}
