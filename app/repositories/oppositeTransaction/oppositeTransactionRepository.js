import prisma from "@/lib/prisma";

class OppositeTransactionRepository {
  async readAll(date, insertBy = null) {
    let whereCondition = { status: 1 };
    
    if (insertBy) {
      whereCondition.insert_by = insertBy;
    }
    
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      
      whereCondition.transaction_date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return prisma.opposite_transaction.findMany({
      orderBy: { transaction_id: "desc" },
      include: {
        paid_by_account: true,
        bank_account_ref: true,
        received_by_account: true,
      },
      where: whereCondition,
    });
  }

  async readAllWithPagination(skip = 0, take = 10, date, insertBy = null) {
    let whereCondition = { status: 1 };
    
    if (insertBy) {
      whereCondition.insert_by = insertBy;
    }
    
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      
      whereCondition.transaction_date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

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
        where: whereCondition,
      }),
      prisma.opposite_transaction.count({
        where: whereCondition,
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

  async readBalanceSheet(start_date, end_date, acc_id, insertBy = null) {
    const startDate = new Date(start_date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(end_date);
    endDate.setUTCHours(23, 59, 59, 999);

    // Build the insertBy filter
    const insertByFilter = insertBy ? { insert_by: insertBy } : {};

    // Fetch opposite transactions within date range, filtered by creator
    const oppositeTransactions = await prisma.opposite_transaction.findMany({
      where: {
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
        status: 1,
        ...insertByFilter,
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

    // Fetch self transactions within date range, filtered by creator
    const selfTransactions = await prisma.self_transaction.findMany({
      where: {
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
        status: 1,
        ...insertByFilter,
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

    // Fetch local sales within date range, filtered by creator
    const localSales = await prisma.local_sale.findMany({
      where: {
        local_sale_date: {
          gte: startDate,
          lte: endDate,
        },
        received_amount: {
          gt: 0,
        },
        status: 1,
        ...insertByFilter,
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

    // Fetch expense transactions within date range, filtered by creator
    const expenseTransactions = await prisma.expense_transaction.findMany({
      where: {
        expense_t_date: {
          gte: startDate,
          lte: endDate,
        },
        status: 1,
        ...insertByFilter,
      },
      include: {
        account: {
          select: {
            account_nam: true,
          },
        },
      },
      orderBy: {
        expense_t_date: "asc",
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
      ...expenseTransactions.map((t) => ({
        ...t,
        type: "expense",
        transaction_date: t.expense_t_date,
      })),
    ].sort(
      (a, b) => new Date(a.transaction_date) - new Date(b.transaction_date),
    );

    return combinedTransactions;
  }

  async readAllCashBalanceSheet(start_date, end_date) {
    const startDate = new Date(start_date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(end_date);
    endDate.setUTCHours(23, 59, 59, 999);

    const cashAccounts = await prisma.accounts.findMany({
      where: {
        subhead: { subhead_nam: "Cash In Hand" },
        status: 1,
      },
      select: { acc_id: true },
    });
    const cashAccIds = cashAccounts.map((a) => a.acc_id);

    const oppositeTransactions = await prisma.opposite_transaction.findMany({
      where: {
        transaction_date: { gte: startDate, lte: endDate },
        status: 1,
      },
      include: {
        paid_by_account: { select: { account_nam: true } },
        received_by_account: { select: { account_nam: true } },
      },
      orderBy: { transaction_date: "asc" },
    });

    const selfTransactions = await prisma.self_transaction.findMany({
      where: {
        transaction_date: { gte: startDate, lte: endDate },
        status: 1,
      },
      include: {
        account: { select: { account_nam: true } },
      },
      orderBy: { transaction_date: "asc" },
    });

    const localSales = await prisma.local_sale.findMany({
      where: {
        local_sale_date: { gte: startDate, lte: endDate },
        received_amount: { gt: 0 },
        status: 1,
      },
      include: {
        purchaser_account_ref: { select: { account_nam: true } },
      },
      orderBy: { local_sale_date: "asc" },
    });

    const combinedTransactions = [
      ...oppositeTransactions.map((t) => ({ ...t, type: "opposite" })),
      ...selfTransactions.map((t) => ({ ...t, type: "self" })),
      ...localSales.map((t) => ({
        ...t,
        type: "local_sale",
        transaction_date: t.local_sale_date,
      })),
    ].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    return { transactions: combinedTransactions, cashAccIds };
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
