import designationController from "@/app/controllers/employeeDesignation/designationController";

export async function GET() {
  return designationController.readAll();
}
