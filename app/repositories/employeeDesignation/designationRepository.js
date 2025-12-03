import prisma from "@/lib/prisma";

class designationRepository {
  async create(designation_nam) {
    return prisma.employee_designation.create({
      data: { designation_nam: designation_nam },
    });
  }

  async checkDuplicate(designation_nam) {
    return prisma.employee_designation.findFirst({
      where: { designation_nam: designation_nam },
    });
  }

  async readAll() {
    return prisma.employee_designation.findMany({
      orderBy: { designation_id: "asc" },
      select: {
        designation_id: true,
        designation_nam: true,
        status: true,
      },
    });
  }

  async update(req_object) {
    return prisma.employee_designation.update({
      where: {
        designation_id: Number(req_object.designation_id),
      },
      data: {
        designation_nam: req_object.designation_nam,
      },
    });
  }
}

export default new designationRepository();
