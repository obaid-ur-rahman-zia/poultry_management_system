import EmployeeController from "@/app/controllers/employee/employeeController";

export async function GET() {
  return EmployeeController.readAll();
}
