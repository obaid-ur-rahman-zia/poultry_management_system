import prisma from "@/lib/prisma";

class VehicleTypeRepository {
  async create(req_object) {
    return prisma.vehicle_type.create({
      data: {
        vehicle_type_nam: req_object.vehicle_type_nam,
      },
    });
  }

  async checkDuplicate(vehicle_type_nam) {
    return prisma.vehicle_type.findFirst({
      where: { vehicle_type_nam: vehicle_type_nam },
    });
  }
  async readAll() {
    return prisma.vehicle_type.findMany({
      orderBy: { vehicle_type_id: "asc" },
      select: {
        vehicle_type_id: true,
        vehicle_type_nam: true,
        status: true,
      },
    });
  }

  async update(req_object) {
    return prisma.vehicle_type.update({
      where: {
        vehicle_type_id: Number(req_object.vehicle_type_id),
      },
      data: {
        vehicle_type_nam: req_object.vehicle_type_nam,
      },
    });
  }
}

export default new VehicleTypeRepository();
