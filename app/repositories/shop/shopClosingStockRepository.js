import prisma from "@/lib/prisma";

class ShopClosingStockRepository {
  async readAll(shop_acc_id) {
    const where = { status: 1 };
    if (shop_acc_id) where.shop_acc_id = Number(shop_acc_id);
    return prisma.shop_closing_stock.findMany({
      where,
      include: {
        shop_account: { select: { acc_id: true, account_nam: true } },
      },
      orderBy: { closing_date: "desc" },
    });
  }

  async readByDateAndShop(shop_acc_id, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return prisma.shop_closing_stock.findFirst({
      where: {
        shop_acc_id: Number(shop_acc_id),
        closing_date: { gte: start, lte: end },
        status: 1,
      },
    });
  }

  /**
   * Get the most recent closing stock BEFORE the given date (exclusive).
   * If no closing stock exists before that date, returns null → previous_stock = 0.
   * This carries forward the last entered closing stock if no new one is entered for intermediate dates.
   */
  async getPreviousStock(shop_acc_id, beforeDate) {
    const before = new Date(beforeDate);
    before.setHours(0, 0, 0, 0); // exclusive: strictly before start of selected date
    return prisma.shop_closing_stock.findFirst({
      where: {
        shop_acc_id: Number(shop_acc_id),
        closing_date: { lt: before },
        status: 1,
      },
      orderBy: { closing_date: "desc" },
    });
  }

  /**
   * Upsert: if a closing stock record already exists for this shop+date, update it;
   * otherwise create a new one.
   */
  async upsert(data) {
    const existing = await this.readByDateAndShop(data.shop_acc_id, data.closing_date);

    if (existing) {
      return prisma.shop_closing_stock.update({
        where: { closing_id: existing.closing_id },
        data: {
          closing_weight: Number(data.closing_weight),
          update_by: data.update_by || "user 1",
          status: 1,
        },
      });
    }

    return prisma.shop_closing_stock.create({
      data: {
        closing_date: new Date(data.closing_date),
        shop_acc_id: Number(data.shop_acc_id),
        closing_weight: Number(data.closing_weight),
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: 1,
      },
    });
  }
}

export default new ShopClosingStockRepository();
