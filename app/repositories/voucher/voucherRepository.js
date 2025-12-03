import prisma from "@/lib/prisma";

class VoucherRepository {
  async readAll() {
    return prisma.voucher.findMany({
      where: { isDeleted: false },
      orderBy: { voucher_id: "asc" },
    });
  }

  async getNextVoucherId(financialYear) {
    const lastVoucher = await prisma.voucher.findFirst({
      where: {
        financial_year: financialYear,
        // isDeleted: false,
      },
      orderBy: { voucher_id: "desc" },
      select: { voucher_id: true },
    });

    return lastVoucher ? lastVoucher.voucher_id + 1 : 1;
  }

  async readNextId() {
    const maxId = await prisma.voucher.aggregate({
      _max: { voucher_id: true },
      where: { isDeleted: false },
    });
    return (maxId._max.voucher_id || 0) + 1;
  }

  async readByAccountId(acc_id) {
    return prisma.voucher.findMany({
      where: {
        acc_id: parseInt(acc_id),
        isDeleted: false,
      },
      include: {
        account: true,
      },
      orderBy: {
        transaction_dat: "desc",
      },
    });
  }

  async readByVoucherId(voucher_id, financial_year) {
    return prisma.voucher.findMany({
      where: {
        voucher_id: parseInt(voucher_id),
        // isDeleted: false,
        financial_year: financial_year.toString(),
      },
      include: {
        account: true,
      },
      orderBy: {
        record_no: "asc",
      },
    });
  }

  async create(data) {
    return prisma.voucher.create({
      data: {
        voucher_id: data.voucher_id,
        record_no: data.record_no,
        financial_year: data.financial_year,
        voucher_type: data.voucher_type,
        debit: Number(data.debit),
        credit: Number(data.credit),
        remarks: data.remarks,
        manual_voucher_no: data.manual_voucher_no,
        isDeleted: false,
        isEdited: false,
        account: {
          connect: {
            acc_id: data.acc_id,
          },
        },
      },
    });
  }

  async update(v_id, data) {
    return prisma.voucher.update({
      where: { v_id: Number(v_id) },
      data: {
        financial_year: data.financial_year,
        voucher_type: data.voucher_type,
        debit: data.debit,
        credit: data.credit,
        remarks: data.remarks,
        manual_voucher_no: data.manual_voucher_no,
        isDeleted: data.isDeleted,
        isEdited: data.isEdited,
        account: {
          connect: {
            acc_id: data.acc_id,
          },
        },
      },
    });
  }

  async softDelete(voucher_id) {
    return prisma.voucher.updateMany({
      where: { voucher_id: Number(voucher_id) },
      data: {
        isDeleted: true,
      },
    });
  }

  async hardDelete(voucher_id) {
    return prisma.voucher.deleteMany({
      where: { voucher_id: Number(voucher_id) },
    });
  }

  async findDeleted() {
    return prisma.voucher.findMany({
      where: { isDeleted: true },
      orderBy: { voucher_id: "asc" },
      include: {
        account: true,
      },
    });
  }

  async restore(voucher_id) {
    return prisma.voucher.updateMany({
      where: { voucher_id: Number(voucher_id) },
      data: {
        isDeleted: false,
      },
    });
  }
}

export default new VoucherRepository();

// import prisma from "@/lib/prisma";
// import transactionRepository from "../transaction/transactionRepository";
// import { reverseDebitCredit } from "@/lib/utils";

// class VoucherRepository {
//   async readAll() {
//     return prisma.voucher.findMany({
//       orderBy: { voucher_id: "asc" },
//     });
//   }

//   //   async findAvailableVoucher() {
//   //     return prisma.voucher.findMany({
//   //       orderBy: { voucher_id: "asc" },
//   //     });
//   //   }

//   async getNextVoucherId(financialYear) {
//     const lastVoucher = await prisma.voucher.findFirst({
//       where: { financial_year: financialYear },
//       orderBy: { voucher_id: "desc" },
//       select: { voucher_id: true },
//     });

//     return lastVoucher ? lastVoucher.voucher_id + 1 : 1;
//   }

//   async readNextId() {
//     const maxId = await prisma.voucher.aggregate({
//       _max: { voucher_id: true },
//     });
//     return (maxId._max.voucher_id || 0) + 1;
//   }

//   async readByAccountId(acc_id) {
//     return prisma.voucher.findMany({
//       where: {
//         acc_id: parseInt(acc_id),
//       },
//       include: {
//         account: true, // optional if you want account info
//       },
//       orderBy: {
//         transaction_dat: "desc", // optional
//       },
//     });
//   }

//   async create(data) {
//     return prisma.voucher.create({
//       data: {
//         voucher_id: data.voucher_id,
//         financial_year: data.financial_year,
//         record_no: data.record_no,
//         voucher_type: data.voucher_type,
//         debit: data.debit,
//         credit: data.credit,
//         remarks: data.remarks,
//         manual_voucher_no: data.manual_voucher_no,
//         account: {
//           connect: {
//             acc_id: data.acc_id,
//           },
//         },
//       },
//     });
//   }

//   async createDebitVoucher(data) {
//     const createVoucherForDebit = await prisma.voucher.create({
//       data: {
//         financial_year: data.financial_year,
//         voucher_type: data.voucher_type,
//         debit: data.debit,
//         credit: data.credit,
//         remarks: data.remarks,
//         manual_voucher_no: data.manual_voucher_no,
//         account: {
//           connect: { acc_id: data.acc_id },
//         },
//       },
//     });

//     const transactionDebitData = {
//       ...data,
//       reference_id: createVoucherForDebit.voucher_id, // match voucher.voucher_id
//       reference: "Voucher Entry",
//     };

//     await transactionRepository.create(transactionDebitData);

//     const createVoucherForCredit = await prisma.voucher.create({
//       data: {
//         financial_year: data.financial_year,
//         voucher_type: data.voucher_type,
//         credit: data.debit,
//         remarks: data.remarks,
//         debit: data.credit,
//         manual_voucher_no: data.manual_voucher_no,
//         account: {
//           connect: { acc_id: data.contra_account_id },
//         },
//       },
//     });

//     const transactionCreditData = {
//       ...data,
//       acc_id: data.contra_account_id,
//       reference_id: createVoucherForCredit.voucher_id, // match voucher.voucher_id
//       reference: "Voucher Entry",
//     };

//     await transactionRepository.create(
//       reverseDebitCredit(transactionCreditData)
//     );

//     return {
//       debited_voucher: createVoucherForDebit,
//       credited_voucher: createVoucherForCredit,
//     };
//   }

//   async createCreditVoucher(data) {
//     const createVoucherForCredit = await prisma.voucher.create({
//       data: {
//         financial_year: data.financial_year,
//         voucher_type: data.voucher_type,
//         credit: data.credit,
//         remarks: data.remarks,
//         manual_voucher_no: data.manual_voucher_no,
//         account: {
//           connect: { acc_id: data.acc_id },
//         },
//       },
//     });

//     const transactionCreditData = {
//       ...data,
//       reference_id: createVoucherForCredit.voucher_id, // match voucher.voucher_id
//       reference: "Voucher Entry",
//     };

//     await transactionRepository.create(transactionCreditData);

//     const createVoucherForDebit = await prisma.voucher.create({
//       data: {
//         financial_year: data.financial_year,
//         voucher_type: data.voucher_type,
//         debit: data.credit,
//         remarks: data.remarks,
//         manual_voucher_no: data.manual_voucher_no,
//         account: {
//           connect: { acc_id: data.contra_account_id },
//         },
//       },
//     });

//     const transactionDebitData = {
//       ...data,
//       acc_id: data.contra_account_id,
//       reference_id: createVoucherForDebit.voucher_id, // match voucher.voucher_id
//       reference: "Voucher Entry",
//     };

//     await transactionRepository.create(
//       reverseDebitCredit(transactionDebitData)
//     );

//     return {
//       credited_voucher: createVoucherForCredit,
//       debited_voucher: createVoucherForDebit,
//     };
//   }

//   //   async update(voucherId, newAreaName) {
//   //     return prisma.voucher.update({
//   //       where: { voucher_id: Number(voucherId) },
//   //       data: {
//   //         voucher: newAreaName,
//   //       },
//   //     });
//   //   }
// }

// export default new VoucherRepository();
