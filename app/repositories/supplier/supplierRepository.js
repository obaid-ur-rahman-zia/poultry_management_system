import prisma from "@/lib/prisma";

class SupplierRepository {
  async readAll() {
    return prisma.accounts.findMany({
      where: { is_supplier: 1 },
      orderBy: { acc_id: "asc" },
      select: {
        acc_id: true,
        account_nam: true,
      },
    });
  }

  async readNextId() {
    const maxId = await prisma.accounts.aggregate({
      _max: { acc_id: true },
    });
    return (maxId._max.acc_id || 0) + 1;
  }

  async create(data) {
    return await prisma.$transaction(
      async (tx) => {
        // Get the max account_id for this sub_id
        const maxAccount = await tx.accounts.findFirst({
          where: { sub_id: data.sub_id },
          orderBy: { account_id: "desc" },
          select: { account_id: true },
        });

        const nextAccountId = maxAccount ? maxAccount.account_id + 1 : 1;

        // Create the account with calculated account_id
        return await tx.accounts.create({
          data: {
            head_id: data.head_id,
            sub_id: data.sub_id,
            account_id: nextAccountId,
            account_nam: data.account_nam,
            account_cnic: data.account_cnic,
            account_address: data.account_address,
            account_alter_nam: data.account_alter_nam,
            account_contact: data.account_contact,
            account_reference: data.account_reference,
            company_id: data.company_id,

            is_supplier: 1,
            insert_by: data.insert_by || "user 1",
            update_by: data.update_by || "user 1",
            status: data.status ?? 1,
          },
        });
      },
      {
        timeout: 10000, // ⏱ 10 seconds
        maxWait: 5000, // optional: how long to wait for a connection (5s)
      }
    );
  }

  async checkDuplicate(account_cnic) {
    return prisma.accounts.findFirst({
      where: { account_cnic: account_cnic },
    });
  }

  async readById(acc_id) {
    return prisma.accounts.findFirst({
      where: {
        acc_id: parseInt(acc_id),
        is_supplier: 1,
      },
      select: {
        acc_id: true,
        head_id: true,
        sub_id: true,
        account_id: true,
        account_nam: true,
        account_cnic: true,
        account_address: true,
        account_alter_nam: true,
        account_contact: true,
        account_reference: true,
        company_id: true,
        insert_dat: true,
        update_dat: true,
        insert_by: true,
        update_by: true,
        status: true,
        company: {
          select: {
            company_id: true,
            company_nam: true,
          },
        },
      },
    });
  }

  async update(req_object) {
    // Build update object dynamically (only update provided fields)
    console.log("Update data:", req_object);
    return prisma.accounts.update({
      where: {
        acc_id: req_object.acc_id,
      },
      data: {
        account_nam: req_object.account_nam,
        account_cnic: req_object.account_cnic,
        account_address: req_object.account_address,
        account_alter_nam: req_object.account_alter_nam,
        account_contact: req_object.account_contact,
        account_reference: req_object.account_reference,
        company_id: req_object.company_id,
      },
    });
  }

  async delete(acc_id) {
    return prisma.accounts.delete({
      where: {
        acc_id: parseInt(acc_id),
      },
    });
  }
}

export default new SupplierRepository();
