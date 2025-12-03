import prisma from "@/lib/prisma";

class CompanyRepository {
  async create(company_nam) {
    return prisma.pro_company.create({
      data: { company_nam: company_nam },
    });
  }

  async checkDuplicate(company_nam) {
    return prisma.pro_company.findFirst({
      where: { company_nam: company_nam },
    });
  }
  async readAll() {
    return prisma.pro_company.findMany({
      orderBy: { company_id: "asc" },
      select: {
        company_id: true,
        company_nam: true,
        status: true,
      },
    });
  }
  async update(req_object) {
    return prisma.pro_company.update({
      where: {
        company_id: Number(req_object.company_id),
      },
      data: {
        company_nam: req_object.company_nam,
      },
    });
  }
}

export default new CompanyRepository();
