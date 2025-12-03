import prisma from "@/lib/prisma";

class CategoryRepository {
  async readAll() {
    return prisma.pro_category.findMany({
      orderBy: { procategory_id: "asc" },
      include: {
        parent: true,
        children: {
          select: {
            procategory_nam: true,
            procategory_id: true,
          },
        },
      },
    });
  }

  async create(data) {
    return prisma.pro_category.create({
      data: {
        procategory_nam: data.procategory_nam,
        is_parent: data.is_parent || 0,
        parent_id: data.parent_id || null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
    });
  }

  async checkDuplicate(procategory_nam) {
    return prisma.pro_category.findFirst({
      where: { procategory_nam: procategory_nam },
    });
  }

  async update(procategory_id, req_object) {
    return prisma.pro_category.update({
      where: {
        procategory_id: Number(procategory_id),
      },
      data: {
        procategory_nam: req_object.procategory_nam,
        is_parent: req_object.is_parent || 0,
        parent_id: req_object.parent_id || null,
        update_by: req_object.update_by || "user 1",
        status: req_object.status ?? 1,
      },
    });
  }
}

export default new CategoryRepository();
