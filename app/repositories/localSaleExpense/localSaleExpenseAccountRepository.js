import prisma from "@/lib/prisma";

class LocalSaleExpenseAccountRepository {
    async readAll() {
        return prisma.local_sale_expense_account.findMany({
            where: { status: 1 },
            orderBy: { ls_account_id: "desc" },
            include: {
                subhead: true
            }
        });
    }

    async readBySubhead(ls_subhead_id) {
        return prisma.local_sale_expense_account.findMany({
            where: { status: 1, ls_subhead_id: Number(ls_subhead_id) },
            orderBy: { ls_account_id: "desc" },
            include: {
                subhead: true
            }
        });
    }

    async create(data) {
        return prisma.local_sale_expense_account.create({
            data: {
                ls_subhead_id: Number(data.ls_subhead_id),
                account_nam: data.account_nam,
                insert_by: data.insert_by || "user 1",
                update_by: data.update_by || "user 1",
                status: data.status ?? 1,
            },
            include: {
                subhead: true
            }
        });
    }

    async update(ls_account_id, data) {
        return prisma.local_sale_expense_account.update({
            where: { ls_account_id: Number(ls_account_id) },
            data: {
                ls_subhead_id: data.ls_subhead_id !== undefined ? Number(data.ls_subhead_id) : undefined,
                account_nam: data.account_nam !== undefined ? data.account_nam : undefined,
                update_by: data.update_by || "user 1",
                status: data.status ?? 1,
            },
            include: {
                subhead: true
            }
        });
    }

    async delete(ls_account_id) {
        return prisma.local_sale_expense_account.update({
            where: { ls_account_id: Number(ls_account_id) },
            data: { status: 0 },
        });
    }
}

export default new LocalSaleExpenseAccountRepository();
