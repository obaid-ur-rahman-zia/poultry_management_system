import salesmanController from "@/app/controllers/employee/employeeController";

export async function PUT(req) {
  return salesmanController.assignArea(req);
}
