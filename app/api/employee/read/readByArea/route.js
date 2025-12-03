import employeeController from "@/app/controllers/employee/employeeController";

export async function GET(req) {
  return employeeController.readByArea(req);
}
