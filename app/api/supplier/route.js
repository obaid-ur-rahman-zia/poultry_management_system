import SupplierController from "@/app/controllers/supplier/supplierController";

export async function POST(req) {
  return SupplierController.create(req);
}

export async function PUT(req) {
  return SupplierController.update(req);
}
