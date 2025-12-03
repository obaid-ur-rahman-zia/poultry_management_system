import prisma from "@/lib/prisma";

class FlocRepository {
  async readAll() {
    return prisma.floc.findMany({
      orderBy: { floc_id: "desc" },
      include: {
        farm: true,
      },
      where: {
        status: 1,
      },
    });
  }

  async readById(floc_id) {
    return prisma.floc.findUnique({
      where: {
        floc_id: Number(floc_id),
      },
      include: {
        farm: true,
      },
    });
  }

  async readByFarmId(farm_id) {
    return prisma.floc.findMany({
      where: {
        farm_id: Number(farm_id),
        status: 1,
      },
      orderBy: { starting_date: "desc" },
      include: {
        farm: true,
      },
    });
  }

  async findActiveFlocByFarmId(farm_id) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.floc.findFirst({
      where: {
        farm_id: Number(farm_id),
        status: 1,
        OR: [
          { ending_date: null },
          { ending_date: { gte: today } },
        ],
      },
      include: {
        farm: true,
      },
    });
  }

  async create(data) {
    return prisma.floc.create({
      data: {
        farm_id: data.farm_id,
        starting_date: new Date(data.starting_date),
        ending_date: data.ending_date ? new Date(data.ending_date) : null,
        stackholders: data.stackholders || [],
        clear_description: null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
      include: {
        farm: true,
      },
    });
  }

  async update(floc_id, req_object) {
    const updateData = {
      update_by: req_object.update_by || "user 1",
      status: req_object.status ?? 1,
    };

    if (req_object.farm_id !== undefined) {
      updateData.farm_id = req_object.farm_id;
    }
    if (req_object.starting_date !== undefined) {
      updateData.starting_date = new Date(req_object.starting_date);
    }
    if (req_object.ending_date !== undefined) {
      updateData.ending_date = req_object.ending_date ? new Date(req_object.ending_date) : null;
    }
    if (req_object.stackholders !== undefined) {
      updateData.stackholders = req_object.stackholders;
    }

    return prisma.floc.update({
      where: {
        floc_id: Number(floc_id),
      },
      data: updateData,
      include: {
        farm: true,
      },
    });
  }

  async clearEndingDate(floc_id, clear_description) {
    return prisma.floc.update({
      where: {
        floc_id: Number(floc_id),
      },
      data: {
        ending_date: null,
        clear_description: clear_description.trim(),
        update_by: "user 1",
      },
      include: {
        farm: true,
      },
    });
  }

  async delete(floc_id) {
    return prisma.floc.update({
      where: {
        floc_id: Number(floc_id),
      },
      data: {
        status: 0,
      },
    });
  }
}

export default new FlocRepository();

