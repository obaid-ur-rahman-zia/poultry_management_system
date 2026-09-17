import prisma from "@/lib/prisma";

class ShopExpenseSubheadRepository {
    async readAll() {
        return prisma.shop_expense_subhead.findMany({
            where: { status: 1 },
            orderBy: { shop_subhead_id: "desc" },
        });
    }

    async create(data) {
        return prisma.shop_expense_subhead.create({
            data: {
                subhead_nam: data.subhead_nam,
                insert_by: data.insert_by || "user 1",
                update_by: data.update_by || "user 1",
                status: data.status ?? 1,
            },
        });
    }

    async update(shop_subhead_id, data) {
        return prisma.shop_expense_subhead.update({
            where: { shop_subhead_id: Number(shop_subhead_id) },
            data: {
                subhead_nam: data.subhead_nam !== undefined ? data.subhead_nam : undefined,
                update_by: data.update_by || "user 1",
                status: data.status ?? 1,
            },
        });
    }

    async delete(shop_subhead_id) {
        return prisma.shop_expense_subhead.update({
            where: { shop_subhead_id: Number(shop_subhead_id) },
            data: { status: 0 },
        });
    }
}

export default new ShopExpenseSubheadRepository();
