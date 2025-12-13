import prisma from "@/lib/prisma";

class TransactionRepository {
  async readAll() {
    return prisma.transaction.findMany({
      orderBy: { t_id: "desc" },
      where: {
        isDeleted: false,
      },
    });
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
