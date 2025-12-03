import SupplierController from "@/app/controllers/supplier/supplierController";

export async function GET() {
  return SupplierController.readAll();
}
