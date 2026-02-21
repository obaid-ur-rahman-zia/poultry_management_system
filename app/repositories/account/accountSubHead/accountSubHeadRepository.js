import prisma from "@/lib/prisma";

class AccountSubHeadRepository {
  async readAll() {
    return prisma.account_sub_head.findMany({
      orderBy: { sub_id: "asc" },
      include: {
        head: true,
        parent: true,
        children: {
          select: {
            subhead_nam: true,
            subhead_id: true,
            sub_id: true,
          },
        },
      },
    });
  }

  async readAccountsManage() {
    return prisma.account_manage.findMany({
      where: { is_active: 1 },
      select: {
        head_id: true,
        sub_id: true,
        description: true,
        account_lvl: true,
        display_category: true,
      },
    });
  }

  async readByHead(head_id) {
    return prisma.account_sub_head.findMany({
      where: { head_id: Number(head_id) },
      orderBy: { subhead_id: "asc" },
      include: {
        head: true,
        parent: true,
        children: true,
      },
    });
  }

  async readById(sub_id) {
    return prisma.account_sub_head.findUnique({
      where: {
        sub_id: Number(sub_id),
      },
      include: {
        head: true,
        parent: true,
        children: true,
      },
    });
  }

  async checkDuplicate(subhead_nam, excludeSubId = null) {
    const where = {
      subhead_nam: {
        equals: subhead_nam.trim(),
        mode: "insensitive", // Case-insensitive comparison
      },
      status: 1, // Only check active subheads
    };

    // Exclude current subhead when updating
    if (excludeSubId) {
      where.sub_id = { not: Number(excludeSubId) };
    }

    return prisma.account_sub_head.findFirst({
      where,
    });
  }

  // Create with subhead_id generation (sequential per head)
  async create(data) {
    return await prisma.$transaction(
      async (tx) => {
        // Get the max subhead_id for this head_id
        const maxSubhead = await tx.account_sub_head.findFirst({
          where: { head_id: data.head_id },
          orderBy: { subhead_id: "desc" },
          select: { subhead_id: true },
        });

        const nextSubheadId = maxSubhead ? maxSubhead.subhead_id + 1 : 1;

        // Create the subhead with calculated subhead_id
        return await tx.account_sub_head.create({
          data: {
            head_id: data.head_id,
            subhead_id: nextSubheadId,
            subhead_nam: data.subhead_nam,
            is_parent: data.is_parent || 0,
            parent_sub_id: data.parent_sub_id || null,
            insert_by: data.insert_by || "user 1",
            update_by: data.update_by || "user 1",
            status: data.status ?? 1,
          },
        });
      },
      {
        timeout: 10000, // ⏱ 10 seconds
        maxWait: 5000, // optional: how long to wait for a connection (5s)
      },
    );
  }

  async update(sub_id, req_object) {
    return prisma.account_sub_head.update({
      where: {
        sub_id: Number(sub_id),
      },
      data: {
        subhead_nam: req_object.subhead_nam,
        is_parent: req_object.is_parent || 0,
        parent_sub_id: req_object.parent_sub_id || null,
        update_by: req_object.update_by || "user 1",
        status: req_object.status ?? 1,
      },
    });
  }

  async delete(sub_id) {
    return prisma.account_sub_head.delete({
      where: {
        sub_id: Number(sub_id),
      },
    });
  }

  // Find subhead by name
  async findByName(subheadName, tx = null) {
    const prismaClient = tx || prisma;
    return prismaClient.account_sub_head.findFirst({
      where: {
        subhead_nam: {
          equals: subheadName.trim(),
          mode: "insensitive",
        },
        status: 1,
      },
      include: {
        head: true,
      },
    });
  }

  async readTrialBalance(startDate, endDate) {
    // 1. Get all active subheads with their active accounts
    const subheads = await prisma.account_sub_head.findMany({
      where: { status: 1 },
      orderBy: { subhead_id: "asc" },
      include: {
        accounts: {
          where: { status: 1 },
          select: {
            acc_id: true,
            account_nam: true,
            account_contact: true,
          },
        },
      },
    });

    // 2. Aggregate transactions
    const whereCondition = { isDeleted: false };
    if (startDate && endDate) {
      whereCondition.transaction_dat = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transactionAggregates = await prisma.transaction.groupBy({
      by: ["acc_id"],
      _sum: {
        debit: true,
        credit: true,
      },
      where: whereCondition,
    });

    // Map aggregates for O(1) access
    const aggMap = {};
    transactionAggregates.forEach((agg) => {
      aggMap[agg.acc_id] = {
        debit: agg._sum.debit || 0,
        credit: agg._sum.credit || 0,
      };
    });

    // 3. Construct the report
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    const reportData = subheads.map((subhead) => {
      let subheadDebit = 0;
      let subheadCredit = 0;

      const processedAccounts = subhead.accounts.map((acc) => {
        const stats = aggMap[acc.acc_id] || { debit: 0, credit: 0 };
        const balance = stats.debit - stats.credit;

        subheadDebit += stats.debit;
        subheadCredit += stats.credit;

        return {
          name: acc.account_nam,
          contact: acc.account_contact,
          total_debit: stats.debit,
          total_credit: stats.credit,
          balance: balance,
        };
      });

      grandTotalDebit += subheadDebit;
      grandTotalCredit += subheadCredit;

      return {
        subhead_nam: subhead.subhead_nam,
        accounts: processedAccounts,
        total_debit: subheadDebit,
        total_credit: subheadCredit,
        total_balance: subheadDebit - subheadCredit,
      };
    });

    // Filter out subheads that have no accounts if desired?
    // For now returning all as they might be relevant for structure.

    return {
      details: reportData,
      conclusion: {
        total_debit: grandTotalDebit,
        total_credit: grandTotalCredit,
        total_balance: grandTotalDebit - grandTotalCredit,
      },
    };
  }

  async readExpenseHeads() {
    return prisma.account_sub_head.findMany({
      where: {
        parent: {
          subhead_nam: {
            equals: "Expense Head",
            mode: "insensitive",
          },
        },
      },
      orderBy: { subhead_id: "asc" },
    });
  }

  async readExpenseHeadTrialBalance(startDate, endDate) {
    // 1. Get only expense-head subheads (parent named "Expense Head") with their active accounts
    const subheads = await prisma.account_sub_head.findMany({
      where: {
        status: 1,
        parent: {
          subhead_nam: {
            equals: "Expense Head",
            mode: "insensitive",
          },
        },
      },
      orderBy: { subhead_id: "asc" },
      include: {
        accounts: {
          where: { status: 1 },
          select: {
            acc_id: true,
            account_nam: true,
            account_contact: true,
          },
        },
      },
    });

    // 2. Aggregate transactions with optional date range
    const whereCondition = { isDeleted: false };
    if (startDate && endDate) {
      whereCondition.transaction_dat = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereCondition.transaction_dat = { gte: new Date(startDate) };
    } else if (endDate) {
      whereCondition.transaction_dat = { lte: new Date(endDate) };
    }

    const transactionAggregates = await prisma.transaction.groupBy({
      by: ["acc_id"],
      _sum: { debit: true, credit: true },
      where: whereCondition,
    });

    // Map aggregates for O(1) access
    const aggMap = {};
    transactionAggregates.forEach((agg) => {
      aggMap[agg.acc_id] = {
        debit: agg._sum.debit || 0,
        credit: agg._sum.credit || 0,
      };
    });

    // 3. Construct report
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    const reportData = subheads.map((subhead) => {
      let subheadDebit = 0;
      let subheadCredit = 0;

      const processedAccounts = subhead.accounts.map((acc) => {
        const stats = aggMap[acc.acc_id] || { debit: 0, credit: 0 };
        const balance = stats.debit - stats.credit;
        subheadDebit += stats.debit;
        subheadCredit += stats.credit;
        return {
          name: acc.account_nam,
          contact: acc.account_contact,
          total_debit: stats.debit,
          total_credit: stats.credit,
          balance,
        };
      });

      grandTotalDebit += subheadDebit;
      grandTotalCredit += subheadCredit;

      return {
        subhead_nam: subhead.subhead_nam,
        accounts: processedAccounts,
        total_debit: subheadDebit,
        total_credit: subheadCredit,
        total_balance: subheadDebit - subheadCredit,
      };
    });

    return {
      details: reportData,
      conclusion: {
        total_debit: grandTotalDebit,
        total_credit: grandTotalCredit,
        total_balance: grandTotalDebit - grandTotalCredit,
      },
    };
  }
}

export default new AccountSubHeadRepository();
