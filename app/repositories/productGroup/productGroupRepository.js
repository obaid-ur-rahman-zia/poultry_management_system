import prisma from "@/lib/prisma";

class ProductGroupRepository {
  async create(pgroup_nam) {
    return prisma.product_group.create({
      data: { pgroup_nam: pgroup_nam },
    });
  }

  async checkDuplicate(pgroup_nam) {
    return prisma.product_group.findFirst({
      where: { pgroup_nam: pgroup_nam },
    });
  }

  async readAll() {
    return prisma.product_group.findMany({
      orderBy: { pgroup_id: "asc" },
      select: {
        pgroup_id: true,
        pgroup_nam: true,
        status: true,
      },
    });
  }
  async update(req_object) {
    return prisma.product_group.update({
      where: {
        pgroup_id: Number(req_object.pgroup_id),
      },
      data: {
        pgroup_nam: req_object.pgroup_nam,
      },
    });
  }
}

export default new ProductGroupRepository();
