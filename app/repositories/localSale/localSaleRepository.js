import prisma from "@/lib/prisma";

class LocalSaleRepository {
  async readAll() {
    return prisma.local_sale.findMany({
      orderBy: { local_sale_id: "desc" },
      include: {
        local_account_ref: true,
        purchaser_account_ref: true,
      },
      where: { status: 1 },
    });
  }

  async readAllWithPagination(skip = 0, take = 20) {
    const [data, total] = await Promise.all([
      prisma.local_sale.findMany({
        skip,
        take,
        orderBy: { local_sale_id: "desc" },
        include: {
          local_account_ref: true,
          purchaser_account_ref: true,
        },
        where: { status: 1 },
      }),
      prisma.local_sale.count({ where: { status: 1 } }),
    ]);
    return { data, total };
  }

  async readById(local_sale_id) {
    return prisma.local_sale.findUnique({
      where: { local_sale_id: Number(local_sale_id) },
      include: {
        local_account_ref: true,
        purchaser_account_ref: true,
      },
    });
  }

  async readReportDetail(startDate, endDate, localAccount) {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : undefined;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : undefined;
    const whereClause = {
      status: 1,
      ...(startDate && endDate ? {
        local_sale_date: {
          gte: start,
          lte: end,
        }
      } : {}),
      ...(localAccount ? { local_account: Number(localAccount) } : {}),
    };

    return prisma.local_sale.findMany({
      where: whereClause,
      include: {
        local_account_ref: true,
        purchaser_account_ref: true,
        stock_allocations: {
          include: {
            stock_lot: {
              select: { rate: true },
            },
          },
        },
      },
      orderBy: [
        { local_sale_date: 'asc' },
        { local_sale_id: 'asc' }
      ],
    });
  }

  async create(data, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.local_sale.create({
      data: {
        local_sale_date: new Date(data.local_sale_date),
        local_account: Number(data.local_account),
        purchaser_account: Number(data.purchaser_account),
        purchaser_weight: Number(data.purchaser_weight),
        purchaser_rate: Number(data.purchaser_rate),
        purchaser_amount: Number(data.purchaser_amount),
        previous_balance: data.previous_balance !== undefined ? Number(data.previous_balance) : null,
        received_amount: Number(data.received_amount),
        net_balance: data.net_balance !== undefined ? Number(data.net_balance) : null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
      include: {
        local_account_ref: true,
        purchaser_account_ref: true,
      },
    });
  }

  async update(local_sale_id, data, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.local_sale.update({
      where: { local_sale_id: Number(local_sale_id) },
      data: {
        local_sale_date: data.local_sale_date ? new Date(data.local_sale_date) : undefined,
        local_account: data.local_account !== undefined ? Number(data.local_account) : undefined,
        purchaser_account: data.purchaser_account !== undefined ? Number(data.purchaser_account) : undefined,
        purchaser_weight: data.purchaser_weight !== undefined ? Number(data.purchaser_weight) : undefined,
        purchaser_rate: data.purchaser_rate !== undefined ? Number(data.purchaser_rate) : undefined,
        purchaser_amount: data.purchaser_amount !== undefined ? Number(data.purchaser_amount) : undefined,
        previous_balance: data.previous_balance !== undefined ? Number(data.previous_balance) : undefined,
        received_amount: data.received_amount !== undefined ? Number(data.received_amount) : undefined,
        net_balance: data.net_balance !== undefined ? Number(data.net_balance) : undefined,
        update_by: data.update_by || "user 1",
        update_dat: new Date(),
      },
      include: {
        local_account_ref: true,
        purchaser_account_ref: true,
      },
    });
  }

  async delete(local_sale_id, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.local_sale.update({
      where: { local_sale_id: Number(local_sale_id) },
      data: { status: 0, update_dat: new Date() },
    });
  }
}

export default new LocalSaleRepository();
