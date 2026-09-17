import prisma from "@/lib/prisma";

class ShopExpenseRepository {
    async readAll(insertByFilter = null) {
        const where = { status: 1 };
        if (insertByFilter) {
            where.insert_by = insertByFilter;
        }
        return prisma.shop_expense.findMany({
            orderBy: { shop_expense_id: "desc" },
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
            shop_expense_date: { gte: start, lte: end },
        };
        if (insertByFilter) {
            where.insert_by = insertByFilter;
        }
        return prisma.shop_expense.findMany({
            orderBy: { shop_expense_id: "desc" },
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
            shop_expense_date: { gte: start, lte: end },
        };
        if (insertByFilter) {
            where.insert_by = insertByFilter;
        }
        return prisma.shop_expense.findMany({
            orderBy: { shop_expense_date: "asc" },
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
            prisma.shop_expense.findMany({
                skip,
                take,
                orderBy: { shop_expense_id: "desc" },
                where,
                include: {
                    account: {
                        include: {
                            subhead: true,
                        },
                    },
                },
            }),
            prisma.shop_expense.count({
                where,
            }),
        ]);
        return { data, total };
    }

    async readById(shop_expense_id) {
        return prisma.shop_expense.findUnique({
            where: {
                shop_expense_id: Number(shop_expense_id),
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
        return prismaClient.shop_expense.create({
            data: {
                shop_expense_date: new Date(data.shop_expense_date),
                shop_account_id: Number(data.shop_account_id),
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

    async update(shop_expense_id, req_object, tx) {
        const prismaClient = tx || prisma;
        return prismaClient.shop_expense.update({
            where: {
                shop_expense_id: Number(shop_expense_id),
            },
            data: {
                shop_expense_date: req_object.shop_expense_date ? new Date(req_object.shop_expense_date) : undefined,
                shop_account_id: req_object.shop_account_id !== undefined ? Number(req_object.shop_account_id) : undefined,
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

    async delete(shop_expense_id) {
        return prisma.shop_expense.update({
            where: {
                shop_expense_id: Number(shop_expense_id),
            },
            data: {
                status: 0,
            },
        });
    }
}

export default new ShopExpenseRepository();
