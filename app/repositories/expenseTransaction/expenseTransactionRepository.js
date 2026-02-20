import prisma from "@/lib/prisma";

class expenseTransactionRepository {
    async readAll() {
        return prisma.expense_transaction.findMany({
            orderBy: { expense_t_id: "desc" },
            where: { status: 1 },
            include: {
                account: {
                    include: {
                        subhead: {
                            include: { parent: true },
                        },
                    },
                },
            },
        });
    }

    async readAllWithPagination(skip = 0, take = 10) {
        const [data, total] = await Promise.all([
            prisma.expense_transaction.findMany({
                skip,
                take,
                orderBy: { expense_t_id: "desc" },
                where: { status: 1 },
                include: {
                    account: {
                        include: {
                            subhead: {
                                include: { parent: true },
                            },
                        },
                    },
                },
            }),
            prisma.expense_transaction.count({
                where: {
                    status: 1,
                },
            }),
        ]);
        return { data, total };
    }

    async readById(expense_t_id) {
        return prisma.expense_transaction.findUnique({
            where: {
                expense_t_id: Number(expense_t_id),
            },
            include: {
                account: {
                    include: {
                        subhead: {
                            include: { parent: true },
                        },
                    },
                },
            },
        });
    }

    async create(data, tx) {
        const prismaClient = tx || prisma;
        return prismaClient.expense_transaction.create({
            data: {
                expense_t_date: new Date(data.transaction_date),
                account_id: data.account_id,
                amount: Number(data.amount),
                description: data.description || null,
                insert_by: data.insert_by || "user 1",
                update_by: data.update_by || "user 1",
                status: data.status ?? 1,
            },
            include: {
                account: {
                    include: {
                        subhead: {
                            include: { parent: true },
                        },
                    },
                },
            },
        });
    }

    async update(expense_t_id, req_object, tx) {
        const prismaClient = tx || prisma;
        return prismaClient.expense_transaction.update({
            where: {
                expense_t_id: Number(expense_t_id),
            },
            data: {
                expense_t_date: req_object.transaction_date ? new Date(req_object.transaction_date) : undefined,
                account_id: req_object.account_id !== undefined ? req_object.account_id : undefined,
                amount: req_object.amount !== undefined ? Number(req_object.amount) : undefined,
                description: req_object.description !== undefined ? req_object.description : undefined,
                update_by: req_object.update_by || "user 1",
                status: req_object.status ?? 1,
            },
            include: {
                account: {
                    include: {
                        subhead: {
                            include: { parent: true },
                        },
                    },
                },
            },
        });
    }

    async delete(expense_t_id) {
        return prisma.expense_transaction.update({
            where: {
                expense_t_id: Number(expense_t_id),
            },
            data: {
                status: 0,
            },
        });
    }

}

export default new expenseTransactionRepository();


