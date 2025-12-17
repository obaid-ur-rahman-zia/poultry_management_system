import prisma from "@/lib/prisma";

class StackholderRepository {
  async readAll() {
    return prisma.stackholder.findMany({
      where: {
        status: 1,
      },
      orderBy: {
        stackholder_nam: "asc",
      },
    });
  }

  async readById(stackholder_id) {
    return prisma.stackholder.findUnique({
      where: {
        stackholder_id: parseInt(stackholder_id),
      },
    });
  }

  async create(data) {
    return prisma.stackholder.create({
      data: {
        stackholder_nam: data.stackholder_nam.trim(),
        stackholder_cnic: data.stackholder_cnic?.trim() || null,
        stackholder_contact: data.stackholder_contact?.trim() || null,
        stackholder_address: data.stackholder_address?.trim() || null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
    });
  }

  async update(stackholder_id, data) {
    return prisma.stackholder.update({
      where: {
        stackholder_id: parseInt(stackholder_id),
      },
      data: {
        stackholder_nam: data.stackholder_nam !== undefined ? data.stackholder_nam.trim() : undefined,
        stackholder_cnic: data.stackholder_cnic !== undefined ? (data.stackholder_cnic?.trim() || null) : undefined,
        stackholder_contact: data.stackholder_contact !== undefined ? (data.stackholder_contact?.trim() || null) : undefined,
        stackholder_address: data.stackholder_address !== undefined ? (data.stackholder_address?.trim() || null) : undefined,
        update_by: data.update_by || "user 1",
        status: data.status !== undefined ? data.status : undefined,
      },
    });
  }

  async delete(stackholder_id) {
    return prisma.stackholder.update({
      where: {
        stackholder_id: parseInt(stackholder_id),
      },
      data: {
        status: 0,
      },
    });
  }

  async checkDuplicate(stackholder_nam, excludeStackholderId = null) {
    const where = {
      stackholder_nam: {
        equals: stackholder_nam.trim(),
        mode: 'insensitive',
      },
      status: 1,
    };

    if (excludeStackholderId) {
      where.stackholder_id = { not: parseInt(excludeStackholderId) };
    }

    return prisma.stackholder.findFirst({
      where,
    });
  }
}

export default new StackholderRepository();



