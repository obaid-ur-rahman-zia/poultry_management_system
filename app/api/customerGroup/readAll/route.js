import CustomerGroupController from "@/app/controllers/customerGroup/customerGroupController";

export async function GET() {
  return CustomerGroupController.readAll();
}
