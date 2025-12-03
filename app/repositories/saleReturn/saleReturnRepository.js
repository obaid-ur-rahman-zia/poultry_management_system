import prisma from "@/lib/prisma";

class SaleReturnRepository {
  async readAll() {
    return prisma.sale_return.findMany({
      orderBy: { sale_return_id: "asc" },
      select: {
        sale_return_id: true,
      },
    });
  }

  async readNextId() {
    const maxId = await prisma.sale_return.aggregate({
      _max: { sale_return_id: true },
    });
    return (maxId._max.sale_return_id || 0) + 1;
  }
}

export default new SaleReturnRepository();
