import CustomerController from "@/app/controllers/customer/customerController";

export async function POST(req) {
  return CustomerController.create(req);
}

export async function PUT(req) {
  return CustomerController.update(req);
}
