import prisma from "@/lib/prisma";

class FarmRepository {
  async readAll() {
    return prisma.farm.findMany({
      orderBy: { farm_id: "asc" },
      where: {
        status: 1,
      },
    });
  }

  async readById(farm_id) {
    return prisma.farm.findUnique({
      where: {
        farm_id: Number(farm_id),
      },
    });
  }

  async create(data) {
    return prisma.farm.create({
      data: {
        farm_nam: data.farm_nam.trim(),
        capacity: data.capacity ? Number(data.capacity) : null,
        address: data.address || null,
        status: data.status ?? 1,
      },
    });
  }

  async checkDuplicate(farm_nam) {
    return prisma.farm.findFirst({
      where: {
        farm_nam: farm_nam.trim(),
        status: 1,
      },
    });
  }

  async update(farm_id, req_object) {
    return prisma.farm.update({
      where: {
        farm_id: Number(farm_id),
      },
      data: {
        farm_nam: req_object.farm_nam?.trim(),
        capacity: req_object.capacity !== undefined ? (req_object.capacity ? Number(req_object.capacity) : null) : undefined,
        address: req_object.address !== undefined ? req_object.address : undefined,
        status: req_object.status ?? 1,
      },
    });
  }

  async delete(farm_id) {
    return prisma.farm.update({
      where: {
        farm_id: Number(farm_id),
      },
      data: {
        status: 0,
      },
    });
  }
}

export default new FarmRepository();

