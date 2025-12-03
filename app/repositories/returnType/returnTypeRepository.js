import prisma from "@/lib/prisma";

class ReturnTypeRepository {
  async readAll() {
    return prisma.return_type.findMany({
      orderBy: { return_type_id: "asc" },
      select: {
        return_type_id: true,
        return_type_nam: true,
        status: true,
      },
    });
  }
}

export default new ReturnTypeRepository();
