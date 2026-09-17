import prisma from "@/lib/prisma";

class LocalSaleExpenseRepository {
    async readAll(insertByFilter = null) {
        const where = { status: 1 };
        if (insertByFilter) {
            where.insert_by = insertByFilter;
        }
        return prisma.local_sale_expense.findMany({
            orderBy: { ls_expense_id: "desc" },
            where,
            include: {
                account: {
                    include: {
                        subhead: true,
                    },
                },
            },
        });
    }

    async readAllByDate(date, insertByFilter = null) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        const where = {
            status: 1,
            ls_expense_date: { gte: start, lte: end },
        };
        if (insertByFilter) {
            where.insert_by = insertByFilter;
        }
        return prisma.local_sale_expense.findMany({
            orderBy: { ls_expense_id: "desc" },
            where,
            include: {
                account: {
                    include: {
                        subhead: true,
                    },
                },
            },
        });
    }
    
    async readAllByDateRange(startDate, endDate, insertByFilter = null) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const where = {
            status: 1,
            ls_expense_date: { gte: start, lte: end },
        };
        if (insertByFilter) {
            where.insert_by = insertByFilter;
        }
        return prisma.local_sale_expense.findMany({
            orderBy: { ls_expense_date: "asc" },
            where,
            include: {
                account: {
                    include: {
                        subhead: true,
                    },
                },
            },
        });
    }

    async readAllWithPagination(skip = 0, take = 10, insertByFilter = null) {
        const where = { status: 1 };
        if (insertByFilter) {
            where.insert_by = insertByFilter;
        }
        const [data, total] = await Promise.all([
            prisma.local_sale_expense.findMany({
                skip,
                take,
                orderBy: { ls_expense_id: "desc" },
                where,
                include: {
                    account: {
                        include: {
                            subhead: true,
                        },
                    },
                },
            }),
            prisma.local_sale_expense.count({
                where,
            }),
        ]);
        return { data, total };
    }

    async readById(ls_expense_id) {
        return prisma.local_sale_expense.findUnique({
            where: {
                ls_expense_id: Number(ls_expense_id),
            },
            include: {
                account: {
                    include: {
                        subhead: true,
                    },
                },
            },
        });
    }

    async create(data, tx) {
        const prismaClient = tx || prisma;
        return prismaClient.local_sale_expense.create({
            data: {
                ls_expense_date: new Date(data.ls_expense_date),
                ls_account_id: Number(data.ls_account_id),
                amount: Number(data.amount),
                description: data.description || null,
                insert_by: data.insert_by || "user 1",
                update_by: data.update_by || "user 1",
                status: data.status ?? 1,
            },
            include: {
                account: {
                    include: {
                        subhead: true,
                    },
                },
            },
        });
    }

    async update(ls_expense_id, req_object, tx) {
        const prismaClient = tx || prisma;
        return prismaClient.local_sale_expense.update({
            where: {
                ls_expense_id: Number(ls_expense_id),
            },
            data: {
                ls_expense_date: req_object.ls_expense_date ? new Date(req_object.ls_expense_date) : undefined,
                ls_account_id: req_object.ls_account_id !== undefined ? Number(req_object.ls_account_id) : undefined,
                amount: req_object.amount !== undefined ? Number(req_object.amount) : undefined,
                description: req_object.description !== undefined ? req_object.description : undefined,
                update_by: req_object.update_by || "user 1",
                status: req_object.status ?? 1,
            },
            include: {
                account: {
                    include: {
                        subhead: true,
                    },
                },
            },
        });
    }

    async delete(ls_expense_id) {
        return prisma.local_sale_expense.update({
            where: {
                ls_expense_id: Number(ls_expense_id),
            },
            data: {
                status: 0,
            },
        });
    }

}

export default new LocalSaleExpenseRepository();
