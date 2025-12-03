import prisma from "@/lib/prisma";

class WarehouseRepository {
  async create(warehouse_nam) {
    return prisma.warehouse.create({
      data: { warehouse_nam: warehouse_nam },
    });
  }

  async checkDuplicate(warehouse_nam) {
    return prisma.warehouse.findFirst({
      where: { warehouse_nam: warehouse_nam },
    });
  }
  async readAll() {
    return prisma.warehouse.findMany({
      orderBy: { warehouse_id: "asc" },
      select: {
        warehouse_id: true,
        warehouse_nam: true,
        status: true,
      },
    });
  }

  async update(req_object) {
    return prisma.warehouse.update({
      where: {
        warehouse_id: Number(req_object.warehouse_id),
      },
      data: {
        warehouse_nam: req_object.warehouse_nam,
      },
    });
  }
}

export default new WarehouseRepository();
