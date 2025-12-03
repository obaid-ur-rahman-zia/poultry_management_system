import CustomerController from "@/app/controllers/customer/customerController";

export async function GET(req) {
  return CustomerController.readById(req);
}
