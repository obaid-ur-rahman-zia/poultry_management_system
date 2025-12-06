import prisma from "@/lib/prisma";

class UnitRepository {
  async readAll() {
    return prisma.pro_unit.findMany({
      orderBy: { prounit_id: "asc" },
    });
  }

  async create(data, tx = null) {
    const prismaClient = tx || prisma;
    const createData = {
      prounit_nam: data.prounit_nam,
    };
    
    // Add capacity and address if they exist in the schema
    // Note: These fields may need to be added to the schema via migration
    if (data.capacity !== undefined) {
      createData.capacity = data.capacity;
    }
    if (data.address !== undefined) {
      createData.address = data.address;
    }
    
    return prismaClient.pro_unit.create({
      data: createData,
    });
  }
  async checkDuplicate(prounit_nam) {
    return prisma.pro_unit.findFirst({
      where: { prounit_nam: prounit_nam },
    });
  }
  async update(req_object) {
    const updateData = {
      prounit_nam: req_object.prounit_nam,
    };
    
    // Add capacity and address if they exist in the schema
    if (req_object.capacity !== undefined) {
      updateData.capacity = req_object.capacity;
    }
    if (req_object.address !== undefined) {
      updateData.address = req_object.address;
    }
    
    return prisma.pro_unit.update({
      where: {
        prounit_id: Number(req_object.prounit_id),
      },
      data: updateData,
    });
  }
}

export default new UnitRepository();
