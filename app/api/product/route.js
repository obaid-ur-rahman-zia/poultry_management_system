import ProductController from "@/app/controllers/product/productController";

export async function POST(req) {
  return ProductController.create(req);
}

export async function PUT(req) {
  return ProductController.update(req);
}

export async function DELETE(req) {
  return ProductController.delete(req);
}