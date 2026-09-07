import prisma from "@/lib/prisma";

class ShopSaleRepository {
  async readAll(shop_acc_id, date) {
    const where = { status: 1 };
    if (shop_acc_id) where.shop_acc_id = Number(shop_acc_id);
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.sale_date = { gte: start, lte: end };
    }
    return prisma.shop_sale.findMany({
      where,
      include: {
        customer: true,
        shop_account: { select: { acc_id: true, account_nam: true } },
      },
      orderBy: { shop_sale_id: "asc" },
    });
  }

  async readById(shop_sale_id) {
    return prisma.shop_sale.findUnique({
      where: { shop_sale_id: Number(shop_sale_id) },
      include: {
        customer: true,
        shop_account: { select: { acc_id: true, account_nam: true } },
      },
    });
  }

  async create(data) {
    return prisma.shop_sale.create({
      data: {
        sale_date: new Date(data.sale_date),
        shop_acc_id: Number(data.shop_acc_id),
        customer_id: Number(data.customer_id),
        qty: Number(data.qty),
        rate: Number(data.rate),
        amount: Number(data.amount),
        previous_balance: Number(data.previous_balance || 0),
        received_amount: Number(data.received_amount || 0),
        net_balance: Number(data.net_balance || 0),
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: 1,
      },
    });
  }

  async update(shop_sale_id, data) {
    return prisma.shop_sale.update({
      where: { shop_sale_id: Number(shop_sale_id) },
      data: {
        sale_date: data.sale_date ? new Date(data.sale_date) : undefined,
        shop_acc_id: data.shop_acc_id !== undefined ? Number(data.shop_acc_id) : undefined,
        customer_id: data.customer_id !== undefined ? Number(data.customer_id) : undefined,
        qty: data.qty !== undefined ? Number(data.qty) : undefined,
        rate: data.rate !== undefined ? Number(data.rate) : undefined,
        amount: data.amount !== undefined ? Number(data.amount) : undefined,
        previous_balance: data.previous_balance !== undefined ? Number(data.previous_balance) : undefined,
        received_amount: data.received_amount !== undefined ? Number(data.received_amount) : undefined,
        net_balance: data.net_balance !== undefined ? Number(data.net_balance) : undefined,
        update_by: data.update_by || "user 1",
      },
    });
  }

  // Soft delete
  async delete(shop_sale_id) {
    return prisma.shop_sale.update({
      where: { shop_sale_id: Number(shop_sale_id) },
      data: { status: 0 },
    });
  }
}

export default new ShopSaleRepository();
