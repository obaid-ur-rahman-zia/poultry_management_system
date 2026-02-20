import prisma from "@/lib/prisma";

class AccountHeadRepository {
  async readAll() {
    return prisma.account_head.findMany({
      orderBy: { head_id: "asc" },
      include: {
        sub_heads: true,
        accounts: true,
      },
    });
  }

  async readNextId() {
    const maxId = await prisma.account_head.aggregate({
      _max: { head_id: true },
    });
    return (maxId._max.head_id || 0) + 1;
  }

  async create(head_nam) {
    return prisma.account_head.create({
      data: {
        head_nam: head_nam,
      },
    });
  }

  async update(head_id, new_head_nam) {
    return prisma.account_head.update({
      where: { head_id: Number(head_id) },
      data: {
        head_nam: new_head_nam,
      },
    });
  }


}

export default new AccountHeadRepository();
