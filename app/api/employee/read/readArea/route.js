import salesmanController from "@/app/controllers/employee/employeeController";

export async function GET(req) {
  return salesmanController.readAssignedArea(req);
}
