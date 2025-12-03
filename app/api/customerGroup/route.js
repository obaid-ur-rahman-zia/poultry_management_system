import customerGroupController from "@/app/controllers/customerGroup/customerGroupController";

export async function POST(req) {
  return customerGroupController.create(req);
}

export async function PUT(req) {
  return customerGroupController.update(req);
}
