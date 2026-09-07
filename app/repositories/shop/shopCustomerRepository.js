import prisma from "@/lib/prisma";

class ShopCustomerRepository {
  async readAll() {
    return prisma.shop_customer.findMany({
      where: { status: 1 },
      orderBy: { customer_nam: "asc" },
    });
  }

  async readById(customer_id) {
    return prisma.shop_customer.findUnique({
      where: { customer_id: Number(customer_id) },
    });
  }

  async create(data) {
    return prisma.shop_customer.create({
      data: {
        customer_nam: data.customer_nam.trim(),
        customer_contact: data.customer_contact?.trim() || null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: 1,
      },
    });
  }

  // Balance = SUM(amount) - SUM(received_amount) from all active shop_sales for this customer
  async getBalance(customer_id) {
    const result = await prisma.shop_sale.aggregate({
      where: {
        customer_id: Number(customer_id),
        status: 1,
      },
      _sum: {
        amount: true,
        received_amount: true,
      },
    });
    const totalAmount = result._sum.amount || 0;
    const totalReceived = result._sum.received_amount || 0;
    return totalAmount - totalReceived;
  }
}

export default new ShopCustomerRepository();
