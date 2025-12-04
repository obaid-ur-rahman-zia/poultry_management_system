import prisma from "@/lib/prisma";

class FlocRepository {
  async readAll() {
    return prisma.floc.findMany({
      orderBy: { floc_id: "desc" },
      include: {
        unit: true,
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
        unit: true,
      },
    });
  }

  async readByFarmId(farm_id) {
    return prisma.floc.findMany({
      where: {
        prounit_id: Number(farm_id),
        status: 1,
      },
      orderBy: { starting_date: "desc" },
      include: {
        unit: true,
      },
    });
  }

  async findActiveFlocByFarmId(farm_id) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.floc.findFirst({
      where: {
        prounit_id: Number(farm_id),
        status: 1,
        OR: [
          { ending_date: null },
          { ending_date: { gt: today } }, // Only active if ending_date is in the future (after today), not today or past
        ],
      },
      include: {
        unit: true,
      },
    });
  }

  async create(data) {
    return prisma.floc.create({
      data: {
        prounit_id: data.prounit_id || data.farm_id,
        starting_date: new Date(data.starting_date),
        ending_date: data.ending_date ? new Date(data.ending_date) : null,
        stackholders: data.stackholders || [],
        clear_description: null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
      include: {
        unit: true,
      },
    });
  }

  async update(floc_id, req_object) {
    const updateData = {
      update_by: req_object.update_by || "user 1",
      status: req_object.status ?? 1,
    };

    if (req_object.prounit_id !== undefined) {
      updateData.prounit_id = req_object.prounit_id;
    } else if (req_object.farm_id !== undefined) {
      updateData.prounit_id = req_object.farm_id; // Backward compatibility
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
        unit: true,
      },
    });
  }

  async clearEndingDate(floc_id, clear_description) {
    // Set ending_date to today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return prisma.floc.update({
      where: {
        floc_id: Number(floc_id),
      },
      data: {
        ending_date: today,
        clear_description: clear_description.trim(),
        update_by: "user 1",
      },
      include: {
        unit: true,
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

