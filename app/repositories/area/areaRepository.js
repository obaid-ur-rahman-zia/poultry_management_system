import prisma from "@/lib/prisma";

class AreaRepository {
  async readAll() {
    return prisma.areas.findMany({
      where: { status: 1 }, // only active areas
      orderBy: { area_id: "asc" },
    });
  }

  async readUnassigned() {
    return prisma.areas.findMany({
      where: {
        status: 1, // still enforce active
        is_assigned: 0,
      },
      orderBy: { area_id: "asc" },
    });
  }

  async readNextId() {
    const maxId = await prisma.areas.aggregate({
      _max: { area_id: true },
    });
    return (maxId._max.area_id || 0) + 1;
  }

  async create(areaName) {
    return prisma.areas.create({
      data: {
        area_nam: areaName,
        // insert_by, update_by, status will use defaults
      },
    });
  }

  async checkDuplicate(areaName){
    return prisma.areas.findFirst({
      where: { area_nam: areaName },
    });
  }

  async update(areaId, newAreaName) {
    return prisma.areas.update({
      where: { area_id: Number(areaId) },
      data: {
        area_nam: newAreaName,
        update_dat: new Date(), // update timestamp
        // update_by left default for now
      },
    });
  }

}

export default new AreaRepository();
