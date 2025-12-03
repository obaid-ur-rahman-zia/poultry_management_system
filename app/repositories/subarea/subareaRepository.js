import prisma from "@/lib/prisma";

class SubareaRepository {
  async readAll() {
    return prisma.subareas.findMany({
      where: { status: 1 },
      orderBy: { subarea_id: "asc" },
    });
  }

  async create(area_id, subarea_nam) {
    return prisma.subareas.create({
      data: {
        subarea_nam: subarea_nam.trim(),
        area_id: Number(area_id),
      },
    });
  }
  async checkDuplicate(subarea_nam) {
    return prisma.subareas.findFirst({
      where: { subarea_nam: subarea_nam },
    });
  }

  async readNextId() {
    const maxId = await prisma.subareas.aggregate({
      _max: { subarea_id: true },
    });
    return (maxId._max.subarea_id || 0) + 1;
  }
  async readByArea(area_id) {
    return prisma.subareas.findMany({
      where: { area_id: Number(area_id), status: 1 },
      select: { subarea_id: true, subarea_nam: true },
      orderBy: { subarea_id: "asc" },
    });
  }

  async readArea(subarea_id) {
    return prisma.subareas.findUnique({
      where: { subarea_id: Number(subarea_id) },
      select: {
        subarea_id: true,
        subarea_nam: true,
        areas: {
          select: {
            area_id: true,
            area_nam: true,
          },
        },
      },
    });
  }

  async update(subarea_id, new_subarea_nam) {
    return prisma.subareas.update({
      where: { subarea_id: Number(subarea_id) },
      data: { subarea_nam: new_subarea_nam.trim() },
    });
  }
}

export default new SubareaRepository();
