import EmployeeController from "@/app/controllers/employee/employeeController";

export async function POST(req) {
  return EmployeeController.create(req);
}

export async function PUT(req) {
  return EmployeeController.update(req);
}
