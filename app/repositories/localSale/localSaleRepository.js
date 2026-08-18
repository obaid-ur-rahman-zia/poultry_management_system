import prisma from "@/lib/prisma";

class LocalSaleRepository {
  async readAll() {
    return prisma.local_sale.findMany({
      orderBy: { local_sale_id: "desc" },
      include: {
        local_account_ref: true,
        purchaser_account_ref: true,
        source_snapshots: { include: { source: true } },
      },
      where: { status: 1 },
    });
  }

  async readAllWithPagination(skip = 0, take = 20, searchQuery = "", filterDate = "") {
    const where = { status: 1 };
    
    if (searchQuery) {
      where.purchaser_account_ref = {
        account_nam: {
          contains: searchQuery,
          mode: "insensitive"
        }
      };
    }
    
    if (filterDate) {
      const startOfDay = new Date(`${filterDate}T00:00:00.000Z`);
      const endOfDay = new Date(`${filterDate}T23:59:59.999Z`);
      where.local_sale_date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const [data, total] = await Promise.all([
      prisma.local_sale.findMany({
        skip,
        take,
        orderBy: { local_sale_id: "desc" },
        include: {
          local_account_ref: true,
          purchaser_account_ref: true,
          source_snapshots: { include: { source: true } },
        },
        where,
      }),
      prisma.local_sale.count({ where }),
    ]);
    return { data, total };
  }

  async readById(local_sale_id) {
    return prisma.local_sale.findUnique({
      where: { local_sale_id: Number(local_sale_id) },
      include: {
        local_account_ref: true,
        purchaser_account_ref: true,
        source_snapshots: { include: { source: true } },
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

    const localSales = await prisma.local_sale.findMany({
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
        source_snapshots: { include: { source: true } },
      },
      orderBy: [
        { local_sale_date: 'asc' },
        { local_sale_id: 'asc' }
      ],
    });

    const sourceAccount = localAccount
      ? Number(localAccount)
      : undefined;
    const sourceRows = sourceAccount
      ? await prisma.bhagtanwala_source.findMany({
          where: {
            account_id: sourceAccount,
            source_date: { gte: start, lte: end },
            status: 1,
          },
          orderBy: { source_date: "asc" },
        })
      : [];

    const dailySources = sourceRows.reduce((groups, source) => {
      const date = source.source_date.toISOString().slice(0, 10);
      const day = groups[date] || { date, totalWeight: 0, totalCost: 0 };
      day.totalWeight += Number(source.weight) || 0;
      day.totalCost += (Number(source.weight) || 0) * (Number(source.rate) || 0);
      groups[date] = day;
      return groups;
    }, {});

    return {
      localSales,
      dailySources: Object.values(dailySources),
    };
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

  async readProfitReport(startDate, endDate, localAccount, groupBy) {
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

    const localSales = await prisma.local_sale.findMany({
      where: whereClause,
      select: {
        local_sale_date: true,
        purchaser_weight: true,
        purchaser_amount: true,
        received_amount: true,
        source_snapshots: {
          include: { source: true }
        }
      },
    });

    const sourceAccount = localAccount ? Number(localAccount) : undefined;
    const sources = sourceAccount
      ? await prisma.bhagtanwala_source.findMany({
          where: {
            account_id: sourceAccount,
            source_date: { gte: start, lte: end },
            status: 1,
          },
          select: {
            source_date: true,
            weight: true,
            rate: true,
          }
        })
      : [];

    const groupedData = new Map();

    localSales.forEach((sale) => {
      const key = getGroupKey(sale.local_sale_date, groupBy);
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          date: sale.local_sale_date,
          sale_amount: 0,
          received_amount: 0,
          sold_weight: 0,
          purchase_amount: 0,
          source_weight: 0,
        });
      }
      const group = groupedData.get(key);
      group.sale_amount += Number(sale.purchaser_amount) || 0;
      group.received_amount += Number(sale.received_amount) || 0;
      group.sold_weight += Number(sale.purchaser_weight) || 0;
    });

    sources.forEach((source) => {
      const key = getGroupKey(source.source_date, groupBy);
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          date: source.source_date,
          sale_amount: 0,
          received_amount: 0,
          sold_weight: 0,
          purchase_amount: 0,
          source_weight: 0,
        });
      }
      const group = groupedData.get(key);
      group.source_weight += Number(source.weight) || 0;
      group.purchase_amount += (Number(source.weight) || 0) * (Number(source.rate) || 0);
    });

    const results = Array.from(groupedData.entries())
      .map(([key, data]) => {
        const weight_loss = data.source_weight - data.sold_weight;
        const profit_loss = data.sale_amount - data.purchase_amount;
        return {
          period: key,
          date: data.date,
          purchase_amount: data.purchase_amount,
          sale_amount: data.sale_amount,
          received_amount: data.received_amount,
          weight_loss: weight_loss,
          profit_loss: profit_loss,
          source_weight: data.source_weight,
          sold_weight: data.sold_weight
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const grandTotalPurchase = results.reduce((sum, row) => sum + row.purchase_amount, 0);
    const grandTotalSale = results.reduce((sum, row) => sum + row.sale_amount, 0);
    const grandTotalReceived = results.reduce((sum, row) => sum + row.received_amount, 0);
    const grandTotalWeightLoss = results.reduce((sum, row) => sum + row.weight_loss, 0);
    const netProfit = grandTotalSale - grandTotalPurchase;

    return {
      results,
      grandTotalPurchase,
      grandTotalSale,
      grandTotalReceived,
      grandTotalWeightLoss,
      netProfit,
    };
  }
}

function getGroupKey(date, groupBy) {
  const d = new Date(date);

  if (groupBy === "date") {
    return d.toISOString().split("T")[0];
  } else if (groupBy === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  } else if (groupBy === "year") {
    return d.getFullYear().toString();
  }

  return d.toISOString().split("T")[0]; // Default to date
}

export default new LocalSaleRepository();
