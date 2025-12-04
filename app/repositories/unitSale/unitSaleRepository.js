import prisma from "@/lib/prisma";

class UnitSaleRepository {
  async readAll() {
    return prisma.unit_sale.findMany({
      orderBy: { sale_id: "desc" },
      include: {
        unit: true,
        floc: true,
        product: true,
      },
      where: {
        status: 1,
      },
    });
  }

  async readById(sale_id) {
    return prisma.unit_sale.findUnique({
      where: {
        sale_id: Number(sale_id),
      },
      include: {
        unit: true,
        floc: true,
        product: true,
      },
    });
  }

  async checkFsRateForToday(prounit_id, floc_id, sale_date) {
    const date = new Date(sale_date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check if F.S Rate exists in daily_fs_rate for today
    const fsRate = await prisma.daily_fs_rate.findFirst({
      where: {
        prounit_id: Number(prounit_id),
        floc_id: Number(floc_id),
        rate_date: {
          gte: date,
          lt: nextDay,
        },
        status: 1,
      },
    });

    return fsRate;
  }

  async getPreviousFsRates(prounit_id, floc_id) {
    return prisma.daily_fs_rate.findMany({
      where: {
        prounit_id: Number(prounit_id),
        floc_id: Number(floc_id),
        status: 1,
      },
      orderBy: { rate_date: "desc" },
      take: 30, // Get last 30 days
    });
  }

  async createDailyFsRate(data, tx) {
    const prismaClient = tx || prisma;
    // Support both prounit_id and farm_id for backward compatibility
    const prounit_id = data.prounit_id || data.farm_id;
    return prismaClient.daily_fs_rate.create({
      data: {
        rate_date: new Date(data.rate_date),
        prounit_id: Number(prounit_id),
        floc_id: data.floc_id,
        farm_rate: Number(data.farm_rate),
        sale_rate: Number(data.sale_rate),
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
    });
  }

  async create(data, tx) {
    const prismaClient = tx || prisma;
    // Support both prounit_id and farm_id for backward compatibility
    const prounit_id = data.prounit_id || data.farm_id;
    return prismaClient.unit_sale.create({
      data: {
        sale_date: new Date(data.sale_date),
        prounit_id: Number(prounit_id),
        floc_id: data.floc_id,
        farm_rate: data.farm_rate ? Number(data.farm_rate) : null,
        sale_rate: data.sale_rate ? Number(data.sale_rate) : null,
        product_id: data.product_id,
        price: Number(data.price),
        quantity: Number(data.quantity),
        tax_type: data.tax_type || "flat",
        tax_value: Number(data.tax_value) || 0,
        discount_type: data.discount_type || "percentage",
        discount_value: Number(data.discount_value) || 0,
        total: Number(data.total),
        description: data.description || null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
      include: {
        unit: true,
        floc: true,
        product: true,
      },
    });
  }

  async update(sale_id, req_object, tx) {
    const prismaClient = tx || prisma;
    // Support both prounit_id and farm_id for backward compatibility
    const prounit_id = req_object.prounit_id || req_object.farm_id;
    const updateData = {
      sale_date: req_object.sale_date ? new Date(req_object.sale_date) : undefined,
      floc_id: req_object.floc_id !== undefined ? req_object.floc_id : undefined,
      farm_rate: req_object.farm_rate !== undefined ? (req_object.farm_rate ? Number(req_object.farm_rate) : null) : undefined,
      sale_rate: req_object.sale_rate !== undefined ? (req_object.sale_rate ? Number(req_object.sale_rate) : null) : undefined,
      product_id: req_object.product_id !== undefined ? req_object.product_id : undefined,
      price: req_object.price !== undefined ? Number(req_object.price) : undefined,
      quantity: req_object.quantity !== undefined ? Number(req_object.quantity) : undefined,
      tax_type: req_object.tax_type !== undefined ? req_object.tax_type : undefined,
      tax_value: req_object.tax_value !== undefined ? Number(req_object.tax_value) : undefined,
      discount_type: req_object.discount_type !== undefined ? req_object.discount_type : undefined,
      discount_value: req_object.discount_value !== undefined ? Number(req_object.discount_value) : undefined,
      total: req_object.total !== undefined ? Number(req_object.total) : undefined,
      description: req_object.description !== undefined ? req_object.description : undefined,
      update_by: req_object.update_by || "user 1",
      status: req_object.status ?? 1,
    };
    
    if (prounit_id !== undefined) {
      updateData.prounit_id = Number(prounit_id);
    }
    
    return prismaClient.unit_sale.update({
      where: {
        sale_id: Number(sale_id),
      },
      data: updateData,
      include: {
        unit: true,
        floc: true,
        product: true,
      },
    });
  }

  async delete(sale_id) {
    return prisma.unit_sale.update({
      where: {
        sale_id: Number(sale_id),
      },
      data: {
        status: 0,
      },
    });
  }
}

export default new UnitSaleRepository();

