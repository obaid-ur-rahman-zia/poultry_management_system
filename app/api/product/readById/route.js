import ProductController from "@/app/controllers/product/productController";

export async function GET(req) {
  return ProductController.readById(req);
}
