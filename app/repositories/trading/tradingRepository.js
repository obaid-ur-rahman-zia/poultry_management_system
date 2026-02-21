import prisma from "@/lib/prisma";

class TradingRepository {
  async readAll() {
    return prisma.trading.findMany({
      orderBy: { trading_id: "desc" },
      include: {
        buy_from_account_ref: true,
        sale_to_account_ref: true,
        product: true,
      },
      where: {
        status: 1,
      },
    });
  }

  async readAllWithPagination(skip = 0, take = 10) {
    const [data, total] = await Promise.all([
      prisma.trading.findMany({
        skip,
        take,
        orderBy: { trading_id: "desc" },
        include: {
          buy_from_account_ref: true,
          sale_to_account_ref: true,
          product: true,
        },
        where: {
          status: 1,
        },
      }),
      prisma.trading.count({
        where: {
          status: 1,
        },
      }),
    ]);
    return { data, total };
  }

  async readById(trading_id) {
    return prisma.trading.findUnique({
      where: {
        trading_id: Number(trading_id),
      },
      include: {
        buy_from_account_ref: true,
        sale_to_account_ref: true,
        product: true,
      },
    });
  }

  async create(data, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.trading.create({
      data: {
        trading_date: new Date(data.trading_date),
        buy_from_account: data.buy_from_account,
        do_number: data.do_number || null,
        product_id: data.product_id,
        buy_quantity: Number(data.buy_quantity),
        buy_price: Number(data.buy_price),
        buy_tax_type: data.buy_tax_type || "flat",
        buy_tax_value: Number(data.buy_tax_value) || 0,
        buy_discount_type: data.buy_discount_type || "percentage",
        buy_discount_value: Number(data.buy_discount_value) || 0,
        buy_total: Number(data.buy_total),
        buy_detail: data.buy_detail || null,
        sale_to_account: data.sale_to_account,
        sale_price: Number(data.sale_price),
        sale_quantity: Number(data.sale_quantity),
        sale_tax_type: data.sale_tax_type || "flat",
        sale_tax_value: Number(data.sale_tax_value) || 0,
        sale_discount_type: data.sale_discount_type || "percentage",
        sale_discount_value: Number(data.sale_discount_value) || 0,
        sale_total: Number(data.sale_total),
        sale_detail: data.sale_detail || null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
      include: {
        buy_from_account_ref: true,
        sale_to_account_ref: true,
        product: true,
      },
    });
  }

  async update(trading_id, req_object, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.trading.update({
      where: {
        trading_id: Number(trading_id),
      },
      data: {
        trading_date: req_object.trading_date
          ? new Date(req_object.trading_date)
          : undefined,
        buy_from_account:
          req_object.buy_from_account !== undefined
            ? req_object.buy_from_account
            : undefined,
        do_number:
          req_object.do_number !== undefined ? req_object.do_number : undefined,
        product_id:
          req_object.product_id !== undefined
            ? req_object.product_id
            : undefined,
        buy_quantity:
          req_object.buy_quantity !== undefined
            ? Number(req_object.buy_quantity)
            : undefined,
        buy_price:
          req_object.buy_price !== undefined
            ? Number(req_object.buy_price)
            : undefined,
        buy_tax_type:
          req_object.buy_tax_type !== undefined
            ? req_object.buy_tax_type
            : undefined,
        buy_tax_value:
          req_object.buy_tax_value !== undefined
            ? Number(req_object.buy_tax_value)
            : undefined,
        buy_discount_type:
          req_object.buy_discount_type !== undefined
            ? req_object.buy_discount_type
            : undefined,
        buy_discount_value:
          req_object.buy_discount_value !== undefined
            ? Number(req_object.buy_discount_value)
            : undefined,
        buy_total:
          req_object.buy_total !== undefined
            ? Number(req_object.buy_total)
            : undefined,
        buy_detail:
          req_object.buy_detail !== undefined
            ? req_object.buy_detail
            : undefined,
        sale_to_account:
          req_object.sale_to_account !== undefined
            ? req_object.sale_to_account
            : undefined,
        sale_price:
          req_object.sale_price !== undefined
            ? Number(req_object.sale_price)
            : undefined,
        sale_quantity:
          req_object.sale_quantity !== undefined
            ? Number(req_object.sale_quantity)
            : undefined,
        sale_tax_type:
          req_object.sale_tax_type !== undefined
            ? req_object.sale_tax_type
            : undefined,
        sale_tax_value:
          req_object.sale_tax_value !== undefined
            ? Number(req_object.sale_tax_value)
            : undefined,
        sale_discount_type:
          req_object.sale_discount_type !== undefined
            ? req_object.sale_discount_type
            : undefined,
        sale_discount_value:
          req_object.sale_discount_value !== undefined
            ? Number(req_object.sale_discount_value)
            : undefined,
        sale_total:
          req_object.sale_total !== undefined
            ? Number(req_object.sale_total)
            : undefined,
        sale_detail:
          req_object.sale_detail !== undefined
            ? req_object.sale_detail
            : undefined,
        update_by: req_object.update_by || "user 1",
        status: req_object.status ?? 1,
      },
      include: {
        buy_from_account_ref: true,
        sale_to_account_ref: true,
        product: true,
      },
    });
  }

  async delete(trading_id, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.trading.update({
      where: {
        trading_id: Number(trading_id),
      },
      data: {
        status: 0,
      },
    });
  }

  async readReportDetail(req_object) {
    const { start_dat, end_dat } = req_object;

    const whereClause = {
      trading_date: {
        gte: new Date(start_dat),
        lte: new Date(end_dat),
      },
      status: 1,
    };

    return prisma.trading.findMany({
      where: whereClause,
      include: {
        buy_from_account_ref: {
          select: {
            account_nam: true,
            account_contact: true,
          },
        },
        sale_to_account_ref: {
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
        trading_date: "asc",
      },
    });
  }
}

export default new TradingRepository();
