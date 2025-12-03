import SupplierController from "@/app/controllers/supplier/supplierController";

export async function GET(req) {
  return SupplierController.readById(req);
}
