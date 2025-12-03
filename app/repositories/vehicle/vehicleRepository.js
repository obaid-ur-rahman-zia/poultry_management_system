import prisma from "@/lib/prisma";

class VehicleRepository {
  async readAll() {
    return prisma.vehicle.findMany({
      orderBy: { vehicle_id: "asc" },
      include: {
        driver: {
          select: {
            account_nam: true,
          },
        },
        deliveryman: {
          select: {
            account_nam: true,
          },
        },
      },
    });
  }

  async readUnassigned() {
    return prisma.vehicle.findMany({
      where: {
        is_assigned: 0,
      },
      orderBy: { vehicle_id: "asc" },
      include: {
        driver: {
          select: {
            account_nam: true,
          },
        },
        deliveryman: {
          select: {
            account_nam: true,
          },
        },
      },
    });
  }

  async readNextId() {
    const maxId = await prisma.vehicle.aggregate({
      _max: { vehicle_id: true },
    });
    return (maxId._max.vehicle_id || 0) + 1;
  }

  async create(data) {
    return prisma.vehicle.create({
      data: {
        vehicle_nam: data.vehicle_nam,
        vehicle_plate: data.vehicle_plate,
        vehicle_type_id: data.vehicle_type_id,
        driver_id: data.driver_id,
        deliveryman_id: data.deliveryman_id,
      },
    });
  }

  async checkDuplicate(vehicle_plate) {
    return prisma.vehicle.findFirst({
      where: { vehicle_plate: vehicle_plate },
    });
  }
  async update(data) {
    // Build update object dynamically (only update provided fields)
    console.log("Update data:", data);
    return prisma.vehicle.update({
      where: {
        vehicle_id: data.vehicle_id,
      },
      data: {
        vehicle_nam: data.vehicle_nam,
        vehicle_plate: data.vehicle_plate,
        vehicle_type_id: data.vehicle_type_id,
        driver_id: data.driver_id,
        deliveryman_id: data.deliveryman_id,
      },
    });
  }

  async readById(vehicle_id) {
    return prisma.vehicle.findUnique({
      where: {
        vehicle_id: Number(vehicle_id),
      },

      select: {
        vehicle_id: true,
        vehicle_nam: true,
        vehicle_plate: true,
        vehicle_type_id: true,
        driver_id: true,
        deliveryman_id: true,
      },
    });
  }
}

export default new VehicleRepository();
