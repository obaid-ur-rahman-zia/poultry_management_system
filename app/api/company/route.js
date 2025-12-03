import CompanyController from "@/app/controllers/company/companyController";

export async function POST(req) {
  return CompanyController.create(req);
}

export async function PUT(req) {
  return CompanyController.update(req);
}
