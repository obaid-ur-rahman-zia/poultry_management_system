import prisma from "@/lib/prisma";

class AccountsRepository {
  async readAll() {
    return prisma.accounts.findMany({
      orderBy: [{ acc_id: "asc" }],
      include: {
        head: true,
        subhead: true,
      },
    });
  }

  async readByHead(head_id) {
    return prisma.accounts.findMany({
      where: { head_id: Number(head_id) },
      orderBy: [{ sub_id: "asc" }, { account_id: "asc" }],
      include: {
        head: true,
        subhead: true,
      },
    });
  }

  async readBySubHead(sub_id) {
    return prisma.accounts.findMany({
      where: {
        sub_id: Number(sub_id),
      },
      orderBy: { account_id: "asc" },
      include: {
        head: true,
        subhead: true,
      },
    });
  }

  async readById(acc_id, tx = null) {
    const prismaClient = tx || prisma;
    return prismaClient.accounts.findUnique({
      where: {
        acc_id: Number(acc_id),
      },
      include: {
        head: true,
        subhead: true,
      },
    });
  }

  async checkDuplicate(account_nam, sub_id, excludeAccId = null) {
    const where = {
      account_nam: {
        equals: account_nam.trim(),
        mode: 'insensitive', // Case-insensitive comparison
      },
      sub_id: Number(sub_id),
      status: 1, // Only check active accounts
    };

    // Exclude current account when updating
    if (excludeAccId) {
      where.acc_id = { not: Number(excludeAccId) };
    }

    return prisma.accounts.findFirst({
      where,
    });
  }

  // Create with account_id generation (sequential per sub_id)
  async create(data, tx = null) {
    const prismaClient = tx || prisma;
    const shouldUseTransaction = !tx;

    const createAccount = async (client) => {
      // Get the max account_id for this sub_id
      const maxAccount = await client.accounts.findFirst({
        where: { sub_id: data.sub_id },
        orderBy: { account_id: "desc" },
        select: { account_id: true },
      });

      const nextAccountId = maxAccount ? maxAccount.account_id + 1 : 1;

      // Create the account with calculated account_id
      return await client.accounts.create({
        data: {
          head_id: data.head_id,
          sub_id: data.sub_id,
          account_id: nextAccountId,
          account_nam: data.account_nam,
          account_contact: data.account_contact || null,
          account_address: data.account_address || null,
          account_reference: data.account_reference || null,
          account_cnic: data.account_cnic || null,
          account_alter_nam: data.account_alter_nam || null,
          account_no: data.account_no || null,
          insert_by: data.insert_by || "user 1",
          update_by: data.update_by || "user 1",
          status: data.status ?? 1,
        },
      });
    };

    if (shouldUseTransaction) {
      return await prisma.$transaction(async (transactionClient) => {
        return await createAccount(transactionClient);
      });
    } else {
      return await createAccount(prismaClient);
    }
  }

  async update(acc_id, req_object, tx = null) {
    const prismaClient = tx || prisma;
    return prismaClient.accounts.update({
      where: {
        acc_id: Number(acc_id),
      },
      data: {
        account_nam: req_object.account_nam,
        account_contact: req_object.account_contact !== undefined ? req_object.account_contact : undefined,
        account_address: req_object.account_address !== undefined ? req_object.account_address : undefined,
        account_reference: req_object.account_reference !== undefined ? req_object.account_reference : undefined,
        account_cnic: req_object.account_cnic !== undefined ? req_object.account_cnic : undefined,
        account_alter_nam: req_object.account_alter_nam !== undefined ? req_object.account_alter_nam : undefined,
        account_no: req_object.account_no !== undefined ? req_object.account_no : undefined,
        head_id: req_object.head_id !== undefined ? req_object.head_id : undefined,
        sub_id: req_object.sub_id !== undefined ? req_object.sub_id : undefined,
        update_by: req_object.update_by || "user 1",
        status: req_object.status ?? 1,
      },
    });
  }

  async delete(acc_id) {
    return prisma.accounts.delete({
      where: {
        acc_id: Number(acc_id),
      },
    });
  }

  // Find account by name and subhead name
  async findByAccountNameAndSubheadName(accountName, subheadName, tx = null) {
    const prismaClient = tx || prisma;
    return prismaClient.accounts.findFirst({
      where: {
        account_nam: {
          equals: accountName.trim(),
          mode: 'insensitive',
        },
        subhead: {
          subhead_nam: {
            equals: subheadName.trim(),
            mode: 'insensitive',
          },
        },
        status: 1,
      },
      include: {
        head: true,
        subhead: true,
      },
    });
  }

  // Find or create account by name and subhead name
  async findOrCreateByAccountNameAndSubheadName(accountName, subheadName, headId, subId, tx = null) {
    const prismaClient = tx || prisma;
    
    // First try to find existing account
    const existing = await this.findByAccountNameAndSubheadName(accountName, subheadName, tx);
    if (existing) {
      return existing;
    }
    
    // If not found, create it
    return await this.create({
      head_id: headId,
      sub_id: subId,
      account_nam: accountName.trim(),
      insert_by: "system",
      update_by: "system",
      status: 1,
    }, tx);
  }
}

export default new AccountsRepository();
