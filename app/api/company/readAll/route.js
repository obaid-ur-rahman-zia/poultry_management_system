import CompanyController from "@/app/controllers/company/companyController";

export async function GET() {
  return CompanyController.readAll();
}
