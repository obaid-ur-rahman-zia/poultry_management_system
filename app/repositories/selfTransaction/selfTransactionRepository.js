import prisma from "@/lib/prisma";

class SelfTransactionRepository {
  async readAll() {
    return prisma.self_transaction.findMany({
      orderBy: { transaction_id: "desc" },
      include: {
        account: true,
      },
      where: {
        status: 1,
      },
    });
  }

  async readAllWithPagination(skip = 0, take = 10) {
    const [data, total] = await Promise.all([
      prisma.self_transaction.findMany({
        skip,
        take,
        orderBy: { transaction_id: "desc" },
        include: {
          account: true,
        },
        where: {
          status: 1,
        },
      }),
      prisma.self_transaction.count({
        where: {
          status: 1,
        },
      }),
    ]);
    return { data, total };
  }

  async readById(transaction_id) {
    return prisma.self_transaction.findUnique({
      where: {
        transaction_id: Number(transaction_id),
      },
      include: {
        account: true,
      },
    });
  }

  async create(data, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.self_transaction.create({
      data: {
        transaction_date: new Date(data.transaction_date),
        is_bank: data.is_bank || 0,
        account_id: data.account_id,
        transaction_type: data.transaction_type,
        amount: Number(data.amount),
        description: data.description || null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
      include: {
        account: true,
      },
    });
  }

  async update(transaction_id, req_object, tx) {
    const prismaClient = tx || prisma;
    return prismaClient.self_transaction.update({
      where: {
        transaction_id: Number(transaction_id),
      },
      data: {
        transaction_date: req_object.transaction_date ? new Date(req_object.transaction_date) : undefined,
        is_bank: req_object.is_bank !== undefined ? req_object.is_bank : undefined,
        account_id: req_object.account_id !== undefined ? req_object.account_id : undefined,
        transaction_type: req_object.transaction_type !== undefined ? req_object.transaction_type : undefined,
        amount: req_object.amount !== undefined ? Number(req_object.amount) : undefined,
        description: req_object.description !== undefined ? req_object.description : undefined,
        update_by: req_object.update_by || "user 1",
        status: req_object.status ?? 1,
      },
      include: {
        account: true,
      },
    });
  }

  async delete(transaction_id) {
    return prisma.self_transaction.update({
      where: {
        transaction_id: Number(transaction_id),
      },
      data: {
        status: 0,
      },
    });
  }
}

export default new SelfTransactionRepository();

