import prisma from "@/lib/prisma";

class CustomerGroupRepository {
  async create(cgroup_nam) {
    return prisma.customer_group.create({
      data: { cgroup_nam: cgroup_nam },
    });
  }

  async checkDuplicate(cgroup_nam) {
    return prisma.customer_group.findFirst({
      where: { cgroup_nam: cgroup_nam },
    });
  }

  async readAll() {
    return prisma.customer_group.findMany({
      orderBy: { cgroup_id: "asc" },
      select: {
        cgroup_id: true,
        cgroup_nam: true,
        status: true,
      },
    });
  }
  async update(req_object) {
    return prisma.customer_group.update({
      where: {
        cgroup_id: Number(req_object.cgroup_id),
      },
      data: {
        cgroup_nam: req_object.cgroup_nam,
      },
    });
  }
}

export default new CustomerGroupRepository();
