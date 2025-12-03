import ProductGroupController from "@/app/controllers/productGroup/productGroupController";

export async function POST(req) {
  return ProductGroupController.create(req);
}

export async function PUT(req) {
  return ProductGroupController.update(req);
}
