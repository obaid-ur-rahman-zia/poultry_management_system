import prisma from "@/lib/prisma";

class WholeSaleRepository {
  async readAll(dateStr) {
    let whereClause = { status: 1 };
    
    if (dateStr) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.sale_date = {
        gte: date,
        lt: nextDay,
      };
    }

    return prisma.whole_sale.findMany({
      orderBy: { sale_id: "desc" },
      include: {
        former_account_ref: true,
        purcher_account_ref: true,
      },
      where: whereClause,
    });
  }

  async readAllWithPagination(skip = 0, take = 10, dateStr) {
    let whereClause = { status: 1 };
    
    if (dateStr) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.sale_date = {
        gte: date,
        lt: nextDay,
      };
    }

    const [data, total] = await Promise.all([
      prisma.whole_sale.findMany({
        skip,
        take,
        orderBy: { sale_id: "desc" },
        include: {
          former_account_ref: true,
          purcher_account_ref: true,
        },
        where: whereClause,
      }),
      prisma.whole_sale.count({
        where: whereClause,
      }),
    ]);
    return { data, total };
  }

  async readById(sale_id) {
    return prisma.whole_sale.findUnique({
      where: {
        sale_id: Number(sale_id),
      },
      include: {
        former_account_ref: true,
        purcher_account_ref: true,
      },
    });
  }

  async create(data, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.whole_sale.create({
      data: {
        sale_date: new Date(data.sale_date),
        farm_rate: data.farm_rate ? Number(data.farm_rate) : null,
        sale_rate: data.sale_rate ? Number(data.sale_rate) : null,
        former_account: Number(data.former_account),
        van_number: data.van_number.trim(),
        weight: Number(data.weight),
        former_rate: Number(data.former_rate),
        former_amount: Number(data.former_amount),
        purcher_account: Number(data.purcher_account),
        purcher_rate: data.purcher_rate ? Number(data.purcher_rate) : null,
        purcher_amount: Number(data.purcher_amount),
        profit: Number(data.profit) || 0,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
      include: {
        former_account_ref: true,
        purcher_account_ref: true,
      },
    });
  }

  async update(sale_id, req_object, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.whole_sale.update({
      where: {
        sale_id: Number(sale_id),
      },
      data: {
        sale_date: req_object.sale_date
          ? new Date(req_object.sale_date)
          : undefined,
        farm_rate:
          req_object.farm_rate !== undefined
            ? req_object.farm_rate
              ? Number(req_object.farm_rate)
              : null
            : undefined,
        sale_rate:
          req_object.sale_rate !== undefined
            ? req_object.sale_rate
              ? Number(req_object.sale_rate)
              : null
            : undefined,
        former_account:
          req_object.former_account !== undefined
            ? Number(req_object.former_account)
            : undefined,
        van_number:
          req_object.van_number !== undefined
            ? req_object.van_number.trim()
            : undefined,
        weight:
          req_object.weight !== undefined
            ? Number(req_object.weight)
            : undefined,
        former_rate:
          req_object.former_rate !== undefined
            ? Number(req_object.former_rate)
            : undefined,
        former_amount:
          req_object.former_amount !== undefined
            ? Number(req_object.former_amount)
            : undefined,
        purcher_account:
          req_object.purcher_account !== undefined
            ? Number(req_object.purcher_account)
            : undefined,
        purcher_rate:
          req_object.purcher_rate !== undefined
            ? req_object.purcher_rate
              ? Number(req_object.purcher_rate)
              : null
            : undefined,
        purcher_amount:
          req_object.purcher_amount !== undefined
            ? Number(req_object.purcher_amount)
            : undefined,
        profit:
          req_object.profit !== undefined
            ? Number(req_object.profit)
            : undefined,
        update_by: req_object.update_by || "user 1",
        update_dat: new Date(),
      },
      include: {
        former_account_ref: true,
        purcher_account_ref: true,
      },
    });
  }

  async delete(sale_id, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.whole_sale.update({
      where: {
        sale_id: Number(sale_id),
      },
      data: {
        status: 0,
        update_dat: new Date(),
      },
    });
  }

  async checkFsRateForToday(sale_date) {
    const date = new Date(sale_date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check if F.S Rate exists in whole_sale for this date
    const fsRate = await prisma.whole_sale.findFirst({
      where: {
        sale_date: {
          gte: date,
          lt: nextDay,
        },
        OR: [{ farm_rate: { not: null } }, { sale_rate: { not: null } }],
        status: 1,
      },
      orderBy: {
        sale_id: "desc",
      },
    });

    return fsRate;
  }

  async getPreviousFsRates(page = 1, limit = 15) {
    const limitNum = parseInt(limit, 10);
    const offset = (parseInt(page, 10) - 1) * limitNum;

    // Use queryRaw to group by DATE and paginate correctly
    const rates = await prisma.$queryRaw`
      SELECT 
        DATE(sale_date) as sale_date,
        MAX(farm_rate) as farm_rate,
        MAX(sale_rate) as sale_rate
      FROM whole_sale
      WHERE (farm_rate IS NOT NULL OR sale_rate IS NOT NULL) AND status = 1
      GROUP BY DATE(sale_date)
      ORDER BY DATE(sale_date) DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const totalCountResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT DATE(sale_date)) as total
      FROM whole_sale
      WHERE (farm_rate IS NOT NULL OR sale_rate IS NOT NULL) AND status = 1
    `;
    
    const total = Number(totalCountResult[0].total);

    return {
      data: rates.map((r) => ({
        date: r.sale_date,
        sale_date: r.sale_date,
        farm_rate: r.farm_rate,
        sale_rate: r.sale_rate,
      })),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async updateFsRate(sale_date, farm_rate, sale_rate) {
    const date = new Date(sale_date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const updated = await prisma.whole_sale.updateMany({
      where: {
        sale_date: {
          gte: date,
          lt: nextDay,
        },
      },
      data: {
        farm_rate: farm_rate,
        sale_rate: sale_rate,
      },
    });
    return updated;
  }

  async readReportDetail(req_object) {
    const { start_dat, end_dat } = req_object;

    const startDate = new Date(start_dat);
    const endDate = new Date(end_dat);
    endDate.setUTCHours(23, 59, 59, 999);

    const whereClause = {
      sale_date: {
        gte: startDate,
        lte: endDate,
      },
      status: 1,
    };

    return prisma.whole_sale.findMany({
      where: whereClause,
      include: {
        former_account_ref: {
          select: {
            account_nam: true,
            account_contact: true,
          },
        },
        purcher_account_ref: {
          select: {
            account_nam: true,
            account_contact: true,
          },
        },
      },
      orderBy: {
        sale_date: "asc",
      },
    });
  }

  async readProfitLossReport(req_object) {
    const { start_dat, end_dat, group_by } = req_object;

    const startDate = new Date(start_dat);
    const endDate = new Date(end_dat);
    endDate.setUTCHours(23, 59, 59, 999);

    const whereClause = {
      sale_date: {
        gte: startDate,
        lte: endDate,
      },
      status: 1,
    };

    // Fetch whole sale records
    const sales = await prisma.whole_sale.findMany({
      where: whereClause,
      select: {
        sale_date: true,
        former_amount: true,
        purcher_amount: true,
        profit: true,
      },
    });

    // Fetch opposite transactions in the same date range
    const oppositeTransactions = await prisma.opposite_transaction.findMany({
      where: {
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
        status: 1,
      },
      select: {
        transaction_date: true,
        amount: true,
      },
    });

    // Fetch self transactions where cash is received in the same date range
    const selfTransactions = await prisma.self_transaction.findMany({
      where: {
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
        transaction_type: "receive",
        status: 1,
      },
      select: {
        transaction_date: true,
        amount: true,
      },
    });

    const groupedData = new Map();

    sales.forEach((sale) => {
      const key = getGroupKey(sale.sale_date, group_by);
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          purchase: 0,
          sale: 0,
          profit: 0,
          recovery: 0,
          date: sale.sale_date,
        });
      }
      const group = groupedData.get(key);
      group.purchase += sale.former_amount;
      group.sale += sale.purcher_amount;
      group.profit += sale.profit;
    });

    // Group opposite transactions into the same period buckets
    oppositeTransactions.forEach((opp) => {
      const key = getGroupKey(opp.transaction_date, group_by);
      if (!groupedData.has(key)) {
        // Period may only have recovery (no whole sale), still add it
        groupedData.set(key, {
          purchase: 0,
          sale: 0,
          profit: 0,
          recovery: 0,
          date: opp.transaction_date,
        });
      }
      groupedData.get(key).recovery += opp.amount;
    });

    // Group self transactions into the same period buckets
    selfTransactions.forEach((self) => {
      const key = getGroupKey(self.transaction_date, group_by);
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          purchase: 0,
          sale: 0,
          profit: 0,
          recovery: 0,
          date: self.transaction_date,
        });
      }
      groupedData.get(key).recovery += self.amount;
    });

    // Convert to array
    const results = Array.from(groupedData.entries())
      .map(([key, data]) => ({
        period: key,
        date: data.date,
        purchase_amount: data.purchase,
        sale_amount: data.sale,
        profit_loss: data.profit,
        recovery_amount: data.recovery,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate grand totals
    const grandTotalPurchase = results.reduce(
      (sum, row) => sum + row.purchase_amount,
      0,
    );
    const grandTotalSale = results.reduce(
      (sum, row) => sum + row.sale_amount,
      0,
    );
    const netProfit = results.reduce((sum, row) => sum + row.profit_loss, 0);
    const grandTotalRecovery = results.reduce(
      (sum, row) => sum + row.recovery_amount,
      0,
    );

    return {
      results,
      grandTotalPurchase,
      grandTotalSale,
      netProfit,
      grandTotalRecovery,
    };
  }

  async readAccountReport({ acc_id, start_dat, end_dat, group_by }) {
    const accIdInt = parseInt(acc_id);
    const startDate = new Date(start_dat);
    const endDate = new Date(end_dat);
    endDate.setUTCHours(23, 59, 59, 999);

    const sales = await prisma.whole_sale.findMany({
      where: {
        OR: [
          { former_account: accIdInt },
          { purcher_account: accIdInt },
        ],
        sale_date: { gte: startDate, lte: endDate },
        status: 1,
      },
      select: {
        sale_date: true,
        weight: true,
        former_amount: true,
        purcher_amount: true,
        profit: true,
      },
    });

    const groupedData = new Map();

    sales.forEach((sale) => {
      const key = getGroupKey(sale.sale_date, group_by);
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          weight: 0,
          purchase: 0,
          sale: 0,
          profit: 0,
          date: sale.sale_date,
        });
      }
      const group = groupedData.get(key);
      group.weight += sale.weight || 0;
      group.purchase += sale.former_amount || 0;
      group.sale += sale.purcher_amount || 0;
      group.profit += sale.profit || 0;
    });

    const results = Array.from(groupedData.entries())
      .map(([key, data]) => ({
        period: key,
        date: data.date,
        weight: data.weight,
        purchase_amount: data.purchase,
        sale_amount: data.sale,
        profit_loss: data.profit,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const grandTotalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    const grandTotalPurchase = results.reduce((sum, r) => sum + r.purchase_amount, 0);
    const grandTotalSale = results.reduce((sum, r) => sum + r.sale_amount, 0);
    const netProfit = results.reduce((sum, r) => sum + r.profit_loss, 0);

    return { results, grandTotalWeight, grandTotalPurchase, grandTotalSale, netProfit };
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

export default new WholeSaleRepository();
