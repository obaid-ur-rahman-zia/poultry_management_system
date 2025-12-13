// import { PrismaClient } from "../src/generated/prisma";
import prisma from "../lib/prisma.js";

async function main() {
  console.log("🌱 Seeding data...");

  // ---- Account Heads ----
  console.log("Creating Account Heads...");
  await prisma.account_head.createMany({
    data: [
      { head_nam: "Main Head" },
    ],
    skipDuplicates: true,
  });

  // ---- Return Types ----
  console.log("Creating Return Types...");
  await prisma.return_type.createMany({
    data: [
      { return_type_nam: "Expired" },
      { return_type_nam: "Damaged" },
      { return_type_nam: "Other" },
    ],
    skipDuplicates: true,
  });

  // ---- Account Sub Heads ----
  console.log("Creating Account Sub Heads...");
  await prisma.account_sub_head.createMany({
    data: [
      {
        head_id: 1,
        subhead_id: 1,
        subhead_nam: "Bank",
        is_parent: 0,
        parent_sub_id: null,
      },
    ],
    skipDuplicates: true,
  });

  // ---- Accounts ----
  console.log("Creating Accounts...");
  await prisma.accounts.createMany({
    data: [
      // {
      //   head_id: 1,
      //   sub_id: 2,
      //   account_id: 1,
      //   account_nam: "Cash In Hand Acc",
      // },
    ],
    skipDuplicates: true,
  });

  // ---- Account Manage (Subheads - Level 2) ----
  console.log("Creating Account Manage entries (Subheads)...");
  await prisma.account_manage.createMany({
    data: [
      // {
      //   head_id: 1,
      //   sub_id: 2,
      //   description: "Cash In Hand",
      //   account_lvl: 2,
      //   display_category: 1,
      //   is_active: 1,
      //   acc_id: null,
      // },
    ],
    skipDuplicates: true,
  });

  // ---- Account Manage (Accounts - Level 3) ----
  console.log("Creating Account Manage entries (Accounts)...");
  await prisma.account_manage.createMany({
    data: [
      // Note: acc_id is set to null because accounts are created dynamically when users are created
      // {
      //   head_id: 1,
      //   sub_id: 2,
      //   description: "Cash In Hand Acc",
      //   account_lvl: 3,
      //   display_category: 0,
      //   is_active: 1,
      //   acc_id: null, // Accounts are created when users are created
      // },
    ],
    skipDuplicates: true,
  });

  // ---- Users ----
  console.log("Creating Users...");
  const superAdmin = await prisma.user.create({
    data: {
      user_nam: "Super Admin",
      email: "admin@system.com",
      password: "$2b$10$VHtLxoMZtiQPGwIqh2Z53eT09.W8X7aSwyucIj6FKS9IuJqg.gGhO",
      role: "SUPER_ADMIN",
      status: 1,
    },
  });

  // Create Cash In Hand subhead if it doesn't exist
  console.log("Creating Cash In Hand subhead...");
  let cashInHandSubhead = await prisma.account_sub_head.findFirst({
    where: {
      subhead_nam: {
        equals: "Cash In Hand",
        mode: 'insensitive',
      },
    },
  });

  if (!cashInHandSubhead) {
    const firstHead = await prisma.account_head.findFirst({
      orderBy: { head_id: "asc" },
    });

    if (firstHead) {
      const maxSubhead = await prisma.account_sub_head.findFirst({
        where: { head_id: firstHead.head_id },
        orderBy: { subhead_id: "desc" },
        select: { subhead_id: true },
      });
      const nextSubheadId = maxSubhead ? maxSubhead.subhead_id + 1 : 1;

      cashInHandSubhead = await prisma.account_sub_head.create({
        data: {
          head_id: firstHead.head_id,
          subhead_id: nextSubheadId,
          subhead_nam: "Cash In Hand",
          is_parent: 0,
          parent_sub_id: null,
          insert_by: "system",
          update_by: "system",
          status: 1,
        },
      });
    }
  }

  // Create Cash In Hand account for Super Admin
  if (cashInHandSubhead) {
    console.log("Creating Cash In Hand account for Super Admin...");
    const accountName = `Cash Account (${superAdmin.user_nam})`;
    
    const cashInHandAccount = await prisma.accounts.create({
      data: {
        head_id: cashInHandSubhead.head_id,
        sub_id: cashInHandSubhead.sub_id,
        account_id: 1, // First account in this subhead
        account_nam: accountName,
        insert_by: "system",
        update_by: "system",
        status: 1,
      },
    });

    // Link the account to the super admin user
    await prisma.user.update({
      where: { user_id: superAdmin.user_id },
      data: { cash_in_hand_account_id: cashInHandAccount.acc_id },
    });

    console.log(`✅ Cash In Hand account created for Super Admin: ${accountName}`);
  }

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
