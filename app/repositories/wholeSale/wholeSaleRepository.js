import prisma from "@/lib/prisma";

class WholeSaleRepository {
  async readAll() {
    return prisma.whole_sale.findMany({
      orderBy: { sale_id: "desc" },
      include: {
        former_account_ref: true,
        purcher_account_ref: true,
      },
      where: {
        status: 1,
      },
    });
  }

  async readAllWithPagination(skip = 0, take = 10) {
    const [data, total] = await Promise.all([
      prisma.whole_sale.findMany({
        skip,
        take,
        orderBy: { sale_id: "desc" },
        include: {
          former_account_ref: true,
          purcher_account_ref: true,
        },
        where: {
          status: 1,
        },
      }),
      prisma.whole_sale.count({
        where: {
          status: 1,
        },
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

  async getPreviousFsRates() {
    // Get distinct F.S Rates from whole_sale entries, ordered by date descending
    const salesWithFsRate = await prisma.whole_sale.findMany({
      where: {
        OR: [{ farm_rate: { not: null } }, { sale_rate: { not: null } }],
        status: 1,
      },
      select: {
        sale_date: true,
        farm_rate: true,
        sale_rate: true,
      },
      orderBy: {
        sale_date: "desc",
      },
      take: 30, // Get last 30 entries
    });

    // Group by date and get unique combinations
    const rateMap = new Map();
    salesWithFsRate.forEach((sale) => {
      const dateKey = sale.sale_date.toISOString().split("T")[0];
      if (!rateMap.has(dateKey)) {
        rateMap.set(dateKey, {
          date: sale.sale_date,
          sale_date: sale.sale_date,
          farm_rate: sale.farm_rate,
          sale_rate: sale.sale_rate,
        });
      }
    });

    // Format the data
    return Array.from(rateMap.values());
  }

  async readReportDetail(req_object) {
    const { start_dat, end_dat } = req_object;

    const whereClause = {
      sale_date: {
        gte: new Date(start_dat),
        lte: new Date(end_dat),
      },
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

    const whereClause = {
      sale_date: {
        gte: new Date(start_dat),
        lte: new Date(end_dat),
      },
      status: 1,
    };

    const sales = await prisma.whole_sale.findMany({
      where: whereClause,
      select: {
        sale_date: true,
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
          purchase: 0,
          sale: 0,
          profit: 0,
          date: sale.sale_date,
        });
      }
      const group = groupedData.get(key);
      group.purchase += sale.former_amount;
      group.sale += sale.purcher_amount;
      group.profit += sale.profit;
    });

    // Convert to array
    const results = Array.from(groupedData.entries())
      .map(([key, data]) => ({
        period: key,
        date: data.date,
        purchase_amount: data.purchase,
        sale_amount: data.sale,
        profit_loss: data.profit,
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

    return {
      results,
      grandTotalPurchase,
      grandTotalSale,
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

export default new WholeSaleRepository();
