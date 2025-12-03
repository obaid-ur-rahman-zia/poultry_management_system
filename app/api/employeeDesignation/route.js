import designationController from "@/app/controllers/employeeDesignation/designationController";

export async function POST(req) {
  return designationController.create(req);
}

export async function PUT(req) {
  return designationController.update(req);
}
