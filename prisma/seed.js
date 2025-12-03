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
        subhead_nam: "Former",
        is_parent: 0,
        parent_sub_id: null,
      },
      {
        head_id: 1,
        subhead_id: 2,
        subhead_nam: "Purcher",
        is_parent: 0,
        parent_sub_id: null,
      },
      {
        head_id: 1,
        subhead_id: 3,
        subhead_nam: "Local Purcher",
        is_parent: 0,
        parent_sub_id: null,
      },
      {
        head_id: 1,
        subhead_id: 4,
        subhead_nam: "Local Purcher 2",
        is_parent: 0,
        parent_sub_id: null,
      },
      {
        head_id: 1,
        subhead_id: 5,
        subhead_nam: "Feed Supplier",
        is_parent: 0,
        parent_sub_id: null,
      },
      {
        head_id: 1,
        subhead_id: 6,
        subhead_nam: "Feed Buyer",
        is_parent: 0,
        parent_sub_id: null,
      },
      {
        head_id: 1,
        subhead_id: 7,
        subhead_nam: "Ege Former",
        is_parent: 0,
        parent_sub_id: null,
      },
      {
        head_id: 1,
        subhead_id: 8,
        subhead_nam: "Ege Purcher",
        is_parent: 0,
        parent_sub_id: null,
      },
      {
        head_id: 1,
        subhead_id: 9,
        subhead_nam: "Ege Local Purcher",
        is_parent: 0,
        parent_sub_id: null,
      },
      {
        head_id: 1,
        subhead_id: 10,
        subhead_nam: "Friends",
        is_parent: 0,
        parent_sub_id: null,
      },
      {
        head_id: 1,
        subhead_id: 11,
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
      // {
      //   head_id: 1,
      //   sub_id: 2,
      //   description: "Cash In Hand Acc",
      //   account_lvl: 3,
      //   display_category: 0,
      //   is_active: 1,
      //   acc_id: 1,
      // },
    ],
    skipDuplicates: true,
  });

  // ---- Users ----
  console.log("Creating Users...");
  await prisma.user.create({
    data: {
      user_nam: "Super Admin",
      email: "admin@system.com",
      password: "$2b$10$VHtLxoMZtiQPGwIqh2Z53eT09.W8X7aSwyucIj6FKS9IuJqg.gGhO",
      role: "SUPER_ADMIN",
      status: 1,
    },
  });

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
