import CustomerController from "@/app/controllers/customer/customerController";

export async function GET() {
  return CustomerController.readAll();
}
