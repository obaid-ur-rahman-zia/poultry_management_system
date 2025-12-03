import ProductController from "@/app/controllers/product/productController";

export async function GET() {
  return ProductController.readAll();
}
