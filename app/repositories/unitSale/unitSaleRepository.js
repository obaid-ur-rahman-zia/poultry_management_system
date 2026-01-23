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

  async readAllWithPagination(skip = 0, take = 10) {
    const [data, total] = await Promise.all([
      prisma.unit_sale.findMany({
        skip,
        take,
        orderBy: { sale_id: "desc" },
        include: {
          unit: true,
          floc: true,
          product: true,
        },
        where: {
          status: 1,
        },
      }),
      prisma.unit_sale.count({
        where: {
          status: 1,
        },
      }),
    ]);
    return { data, total };
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
    const createData = {
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
      van_number: data.van_number || null,
      description: data.description || null,
      insert_by: data.insert_by || "user 1",
      update_by: data.update_by || "user 1",
      status: data.status ?? 1,
    };

    // Add customer_id if provided
    if (data.customer_id !== undefined) {
      createData.customer_id = Number(data.customer_id);
    }

    return prismaClient.unit_sale.create({
      data: createData,
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
      sale_date: req_object.sale_date
        ? new Date(req_object.sale_date)
        : undefined,
      floc_id:
        req_object.floc_id !== undefined ? req_object.floc_id : undefined,
      customer_id:
        req_object.customer_id !== undefined
          ? Number(req_object.customer_id)
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
      product_id:
        req_object.product_id !== undefined ? req_object.product_id : undefined,
      price:
        req_object.price !== undefined ? Number(req_object.price) : undefined,
      quantity:
        req_object.quantity !== undefined
          ? Number(req_object.quantity)
          : undefined,
      tax_type:
        req_object.tax_type !== undefined ? req_object.tax_type : undefined,
      tax_value:
        req_object.tax_value !== undefined
          ? Number(req_object.tax_value)
          : undefined,
      discount_type:
        req_object.discount_type !== undefined
          ? req_object.discount_type
          : undefined,
      discount_value:
        req_object.discount_value !== undefined
          ? Number(req_object.discount_value)
          : undefined,
      total:
        req_object.total !== undefined ? Number(req_object.total) : undefined,
      van_number:
        req_object.van_number !== undefined
          ? req_object.van_number || null
          : undefined,
      description:
        req_object.description !== undefined
          ? req_object.description
          : undefined,
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

  async readReportDetail(req_object) {
    const { start_dat, end_dat, customer_id, product_id, floc_id } = req_object;

    const whereClause = {
      sale_date: {
        gte: new Date(start_dat),
        lte: new Date(end_dat),
      },
    };

    if (customer_id) {
      whereClause.customer_id = parseInt(customer_id);
    }

    if (product_id) {
      whereClause.product_id = parseInt(product_id);
    }
    if (floc_id) {
      whereClause.floc_id = parseInt(floc_id);
    }

    return prisma.unit_sale.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            account_nam: true,
            account_contact: true,
          },
        },
        product: {
          select: {
            product_title: true,
          },
        },
      },
      orderBy: {
        sale_date: "asc",
      },
    });
  }

  async readProfitLossReport(req_object) {
    const { start_dat, end_dat, group_by, floc_id } = req_object;
    const whereClauseExpense = {
      expense_date: {
        gte: new Date(start_dat),
        lte: new Date(end_dat),
      },
      status: 1,
    };
    console.log("Floc ID", floc_id);
    if (floc_id) {
      whereClauseExpense.floc_id = parseInt(floc_id);
    }
    const expenses = await prisma.unit_expense.findMany({
      where: whereClauseExpense,
      select: {
        expense_date: true,
        total: true,
      },
    });

    const whereClauseSale = {
      sale_date: {
        gte: new Date(start_dat),
        lte: new Date(end_dat),
      },
      status: 1,
    };
    if (floc_id) {
      whereClauseSale.floc_id = parseInt(floc_id);
    }
    const sales = await prisma.unit_sale.findMany({
      where: whereClauseSale,
      select: {
        sale_date: true,
        total: true,
      },
    });

    const groupedData = new Map();

    expenses.forEach((expense) => {
      const key = getGroupKey(expense.expense_date, group_by);
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          purchase: 0,
          sale: 0,
          date: expense.expense_date,
        });
      }
      groupedData.get(key).purchase += expense.total;
    });

    sales.forEach((sale) => {
      const key = getGroupKey(sale.sale_date, group_by);
      if (!groupedData.has(key)) {
        groupedData.set(key, { purchase: 0, sale: 0, date: sale.sale_date });
      }
      groupedData.get(key).sale += sale.total;
    });

    // Convert to array and calculate profit/loss
    const results = Array.from(groupedData.entries())
      .map(([key, data]) => ({
        period: key,
        date: data.date,
        purchase_amount: data.purchase,
        sale_amount: data.sale,
        profit_loss: data.sale - data.purchase,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate grand totals
    const grandTotalPurchase = results.reduce(
      (sum, row) => sum + row.purchase_amount,
      0
    );
    const grandTotalSale = results.reduce(
      (sum, row) => sum + row.sale_amount,
      0
    );
    const netProfit = grandTotalSale - grandTotalPurchase;

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

export default new UnitSaleRepository();
