import EmployeeController from "@/app/controllers/employee/employeeController";

export async function GET(req) {
  return EmployeeController.readById(req);
}
