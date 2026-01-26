import prisma from "@/lib/prisma";

class TransactionRepository {
  async readAll(options = {}) {
    const {
      page = 1,
      limit = 100,
      startDate,
      endDate,
      voucherType,
      financialYear,
    } = options;

    const skip = (page - 1) * limit;
    const where = {
      isDeleted: false,
    };

    if (startDate) {
      where.transaction_dat = {
        ...where.transaction_dat,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.transaction_dat = {
        ...where.transaction_dat,
        lte: new Date(endDate),
      };
    }

    if (voucherType && voucherType !== "all") {
      where.voucher_type = voucherType;
    }

    if (financialYear && financialYear !== "all") {
      where.financial_year = financialYear;
    }

    const [data, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { t_id: "desc" },
        where,
        skip: skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    return { data, totalCount };
  }

  async getBalance(acc_id) {
    return prisma.transaction.aggregate({
      _sum: {
        debit: true,
        credit: true,
      },
      where: {
        acc_id: parseInt(acc_id),
        isDeleted: false, // <-- FIX
      },
    });
  }

  async readAccountLedger(req_object) {
    const { acc_id, start_dat, end } = req_object;

    return prisma.transaction.findMany({
      where: {
        acc_id: parseInt(acc_id),
        transaction_dat: {
          gte: new Date(start_dat),
          lte: end,
        },
        isDeleted: false,
      },
      orderBy: {
        transaction_dat: "asc",
      },
    });
  }

  async readTrialBalance(req_object) {
    const { start_dat, end_dat } = req_object;

    const dateFilter = {};
    if (start_dat && end_dat) {
      dateFilter.transaction_dat = {
        gte: new Date(start_dat),
        lte: new Date(end_dat),
      };
    } else if (start_dat) {
      dateFilter.transaction_dat = {
        gte: new Date(start_dat),
      };
    } else if (end_dat) {
      dateFilter.transaction_dat = {
        lte: new Date(end_dat),
      };
    }

    const transactions = await prisma.transaction.groupBy({
      by: ["acc_id"],
      where: {
        isDeleted: false,
        ...dateFilter,
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });
    const accountIds = transactions.map((t) => t.acc_id);
    const accounts = await prisma.accounts.findMany({
      where: {
        acc_id: {
          in: accountIds,
        },
      },
      select: {
        acc_id: true,
        account_nam: true,
        head_id: true,
        sub_id: true,
        account_id: true,
      },
    });
    const accountMap = new Map(accounts.map((acc) => [acc.acc_id, acc]));
    const balances = transactions
      .map((trans) => {
        const account = accountMap.get(trans.acc_id);
        if (!account) return null;

        const totalDebit = trans._sum.debit || 0;
        const totalCredit = trans._sum.credit || 0;
        const balance = totalDebit - totalCredit;

        if (balance === 0) return null;

        return {
          acc_id: trans.acc_id,
          account_nam: account.account_nam,
          head_id: account.head_id,
          sub_id: account.sub_id,
          account_id: account.account_id,
          debit_balance: balance > 0 ? balance : 0,
          credit_balance: balance < 0 ? Math.abs(balance) : 0,
        };
      })
      .filter((item) => item !== null);

    const debitAccounts = balances
      .filter((acc) => acc.debit_balance > 0)
      .sort((a, b) => a.account_nam.localeCompare(b.account_nam));

    const creditAccounts = balances
      .filter((acc) => acc.credit_balance > 0)
      .sort((a, b) => a.account_nam.localeCompare(b.account_nam));

    const sortedBalances = [...debitAccounts, ...creditAccounts];

    const totalDebit = sortedBalances.reduce(
      (sum, acc) => sum + acc.debit_balance,
      0,
    );
    const totalCredit = sortedBalances.reduce(
      (sum, acc) => sum + acc.credit_balance,
      0,
    );
    return {
      balances: sortedBalances,
      totalDebit,
      totalCredit,
    };
  }

  // Get opening balance (transactions before start date)
  async readOpeningBalance(req_object) {
    const { acc_id, start_dat } = req_object;

    const result = await prisma.transaction.aggregate({
      where: {
        acc_id: parseInt(acc_id),
        transaction_dat: {
          lt: new Date(start_dat),
        },
        isDeleted: false,
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const totalDebit = Number(result._sum.debit) || 0;
    const totalCredit = Number(result._sum.credit) || 0;
    const openingBalance = totalDebit - totalCredit;

    return openingBalance;
  }

  // Get closing balance (transactions up to and including end date)
  async readClosingBalance(req_object) {
    const { acc_id, end_dat } = req_object;

    const result = await prisma.transaction.aggregate({
      where: {
        acc_id: parseInt(acc_id),
        transaction_dat: {
          lte: new Date(end_dat),
        },
        isDeleted: false,
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const totalDebit = Number(result._sum.debit) || 0;
    const totalCredit = Number(result._sum.credit) || 0;
    const closingBalance = totalDebit - totalCredit;

    return closingBalance;
  }

  async readLastTransaction(req_object) {
    const { acc_id } = req_object;

    return prisma.transaction.findFirst({
      where: {
        acc_id: parseInt(acc_id),
        isDeleted: false,
      },
      orderBy: {
        transaction_dat: "desc",
      },
    });
  }

  async create(data, tx) {
    const prismaClient = tx ? tx : prisma;

    return prismaClient.transaction.create({
      data: {
        record_no: data.record_no || null,
        reference_id: data.reference_id,
        reference: data.reference,
        financial_year: data.financial_year || null,
        voucher_type: data.voucher_type || null,
        debit: Number(data.debit) || 0,
        credit: Number(data.credit) || 0,
        remarks: data.remarks || null,
        manual_voucher_no: data.manual_voucher_no || null,
        transaction_dat: data.transaction_dat || new Date(),
        account: {
          connect: { acc_id: data.acc_id },
        },
      },
    });
  }

  async updateByReferenceId(reference_id, record_no, data) {
    return prisma.transaction.updateMany({
      where: {
        reference_id: Number(reference_id),
        record_no: Number(record_no),
        isDeleted: false,
      },
      data: {
        acc_id: data.acc_id,
        financial_year: data.financial_year,
        voucher_type: data.voucher_type,
        debit: Number(data.debit),
        credit: Number(data.credit),
        remarks: data.remarks,
        manual_voucher_no: data.manual_voucher_no,
      },
    });
  }

  async softDeleteByReferenceId(reference_id, reference, tx) {
    const prismaClient = tx ? tx : prisma;
    console.log("Soft deleting transactions with reference_id: ", reference_id);
    return prismaClient.transaction.updateMany({
      where: {
        reference_id: Number(reference_id),
        reference: reference,
      },
      data: {
        isDeleted: true,
      },
    });
  }

  async restoreByReferenceId(reference_id) {
    return prisma.transaction.updateMany({
      where: {
        reference_id: Number(reference_id),
        reference: "Voucher",
      },
      data: {
        isDeleted: false,
      },
    });
  }
}

export default new TransactionRepository();
