import prisma from "@/lib/prisma";

class OppositeTransactionRepository {
  async readAll() {
    return prisma.opposite_transaction.findMany({
      orderBy: { transaction_id: "desc" },
      include: {
        paid_by_account: true,
        bank_account_ref: true,
        received_by_account: true,
      },
      where: {
        status: 1,
      },
    });
  }

  async readAllWithPagination(skip = 0, take = 10) {
    const [data, total] = await Promise.all([
      prisma.opposite_transaction.findMany({
        skip,
        take,
        orderBy: { transaction_id: "desc" },
        include: {
          paid_by_account: true,
          bank_account_ref: true,
          received_by_account: true,
        },
        where: {
          status: 1,
        },
      }),
      prisma.opposite_transaction.count({
        where: {
          status: 1,
        },
      }),
    ]);
    return { data, total };
  }

  async readById(transaction_id) {
    return prisma.opposite_transaction.findUnique({
      where: {
        transaction_id: Number(transaction_id),
      },
      include: {
        paid_by_account: true,
        bank_account_ref: true,
        received_by_account: true,
      },
    });
  }

  async create(data, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.opposite_transaction.create({
      data: {
        transaction_date: new Date(data.transaction_date),
        paid_by: data.paid_by,
        bank_account: data.bank_account || null,
        received_by: data.received_by,
        amount: Number(data.amount),
        description: data.description || null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
      include: {
        paid_by_account: true,
        bank_account_ref: true,
        received_by_account: true,
      },
    });
  }

  async update(transaction_id, req_object, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.opposite_transaction.update({
      where: {
        transaction_id: Number(transaction_id),
      },
      data: {
        transaction_date: req_object.transaction_date
          ? new Date(req_object.transaction_date)
          : undefined,
        paid_by:
          req_object.paid_by !== undefined ? req_object.paid_by : undefined,
        bank_account:
          req_object.bank_account !== undefined
            ? req_object.bank_account
            : undefined,
        received_by:
          req_object.received_by !== undefined
            ? req_object.received_by
            : undefined,
        amount:
          req_object.amount !== undefined
            ? Number(req_object.amount)
            : undefined,
        description:
          req_object.description !== undefined
            ? req_object.description
            : undefined,
        update_by: req_object.update_by || "user 1",
        status: req_object.status ?? 1,
      },
      include: {
        paid_by_account: true,
        bank_account_ref: true,
        received_by_account: true,
      },
    });
  }

  async readBalanceSheet(start_date, end_date) {
    // Fetch opposite transactions within date range
    const oppositeTransactions = await prisma.opposite_transaction.findMany({
      where: {
        transaction_date: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
        status: 1,
      },
      include: {
        paid_by_account: {
          select: {
            account_nam: true,
          },
        },
        received_by_account: {
          select: {
            account_nam: true,
          },
        },
      },
      orderBy: {
        transaction_date: "asc",
      },
    });

    // Fetch self transactions within date range
    const selfTransactions = await prisma.self_transaction.findMany({
      where: {
        transaction_date: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
        status: 1,
      },
      include: {
        account: {
          select: {
            account_nam: true,
          },
        },
      },
      orderBy: {
        transaction_date: "asc",
      },
    });

    // Fetch local transactions within date range
    const localSales = await prisma.local_sale.findMany({
      where: {
        local_sale_date: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
        received_amount: {
          gt: 0,
        },
        status: 1,
      },
      include: {
        purchaser_account_ref: {
          select: {
            account_nam: true,
          },
        },
      },
      orderBy: {
        local_sale_date: "asc",
      },
    });

    // Combine and sort by date
    const combinedTransactions = [
      ...oppositeTransactions.map((t) => ({
        ...t,
        type: "opposite",
      })),
      ...selfTransactions.map((t) => ({
        ...t,
        type: "self",
      })),
      ...localSales.map((t) => ({
        ...t,
        type: "local_sale",
        transaction_date: t.local_sale_date,
      })),
    ].sort(
      (a, b) => new Date(a.transaction_date) - new Date(b.transaction_date),
    );

    return combinedTransactions;
  }

  async delete(transaction_id) {
    return prisma.opposite_transaction.update({
      where: {
        transaction_id: Number(transaction_id),
      },
      data: {
        status: 0,
      },
    });
  }
}

export default new OppositeTransactionRepository();
