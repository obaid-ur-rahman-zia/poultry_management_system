// import { PrismaClient } from "../src/generated/prisma";
import prisma from "../lib/prisma.js";
import Bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding data...");

  // ---- Account Heads ----
  console.log("Creating Account Heads...");
  await prisma.account_head.createMany({
    data: [{ head_nam: "Main Head" }],
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

  // Get first account head
  const firstHead = await prisma.account_head.findFirst({
    orderBy: { head_id: "asc" },
  });

  if (firstHead) {
    // Create subheads one by one to handle duplicates better
    const subheads = [
      {
        head_id: firstHead.head_id,
        subhead_id: 1,
        subhead_nam: "Bank",
        is_parent: 0,
        parent_sub_id: null,
        status: 1,
      },
      {
        head_id: firstHead.head_id,
        subhead_id: 2,
        subhead_nam: "Farmer",
        is_parent: 0,
        parent_sub_id: null,
        status: 1,
      },
      {
        head_id: firstHead.head_id,
        subhead_id: 3,
        subhead_nam: "Purchaser",
        is_parent: 0,
        parent_sub_id: null,
        status: 1,
      },
      {
        head_id: firstHead.head_id,
        subhead_id: 4,
        subhead_nam: "Opening Balance",
        is_parent: 0,
        parent_sub_id: null,
        status: 1,
      },
      {
        head_id: firstHead.head_id,
        subhead_id: 5,
        subhead_nam: "Expense Head",
        is_parent: 1,
        parent_sub_id: null,
        status: 1,
      },
    ];

    for (const subhead of subheads) {
      // Check if subhead already exists by name (case-insensitive)
      const existing = await prisma.account_sub_head.findFirst({
        where: {
          head_id: subhead.head_id,
          subhead_nam: {
            equals: subhead.subhead_nam,
            mode: "insensitive",
          },
        },
      });

      if (!existing) {
        // Check if subhead_id is already taken for this head_id
        const existingById = await prisma.account_sub_head.findFirst({
          where: {
            head_id: subhead.head_id,
            subhead_id: subhead.subhead_id,
          },
        });

        if (existingById) {
          // If subhead_id is taken, find the next available one
          const maxSubhead = await prisma.account_sub_head.findFirst({
            where: { head_id: subhead.head_id },
            orderBy: { subhead_id: "desc" },
            select: { subhead_id: true },
          });
          subhead.subhead_id = maxSubhead ? maxSubhead.subhead_id + 1 : 1;
        }

        await prisma.account_sub_head.create({
          data: subhead,
        });
        console.log(
          `✅ Created subhead: ${subhead.subhead_nam} (subhead_id: ${subhead.subhead_id})`,
        );
      } else {
        console.log(
          `✅ Subhead already exists: ${subhead.subhead_nam} (sub_id: ${existing.sub_id})`,
        );
      }
    }
  }

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
  let superAdmin = await prisma.user.findUnique({
    where: { email: "admin@system.com" },
  });

  // Generate password hash for "admin"
  const hashedPassword = await Bcrypt.hash("Tanvir@1234?", 10);

  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        user_nam: "Super Admin",
        email: "tanvir@system.com",
        // Unhashed password: admin
        password: hashedPassword,
        role: "SUPER_ADMIN",
        status: 1,
      },
    });
    console.log("✅ Super Admin user created");
  } else {
    // Update password if user already exists (to ensure correct password)
    await prisma.user.update({
      where: { email: "admin@system.com" },
      data: {
        // Unhashed password: admin
        password: hashedPassword,
      },
    });
    console.log("✅ Super Admin user already exists, password updated");
  }

  // Create Cash In Hand subhead if it doesn't exist
  console.log("Creating Cash In Hand subhead...");
  let cashInHandSubhead = await prisma.account_sub_head.findFirst({
    where: {
      subhead_nam: {
        equals: "Cash In Hand",
        mode: "insensitive",
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

    // Check if account already exists
    let cashInHandAccount = await prisma.accounts.findFirst({
      where: {
        sub_id: cashInHandSubhead.sub_id,
        account_id: 1,
      },
    });

    if (!cashInHandAccount) {
      cashInHandAccount = await prisma.accounts.create({
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
      console.log(
        `✅ Cash In Hand account created for Super Admin: ${accountName}`,
      );
    } else {
      console.log(
        `✅ Cash In Hand account already exists for Super Admin: ${cashInHandAccount.account_nam}`,
      );
    }

    // Link the account to the super admin user (if not already linked)
    if (superAdmin.cash_in_hand_account_id !== cashInHandAccount.acc_id) {
      await prisma.user.update({
        where: { user_id: superAdmin.user_id },
        data: { cash_in_hand_account_id: cashInHandAccount.acc_id },
      });
      console.log(`✅ Cash In Hand account linked to Super Admin`);
    }
  }

  // Verify that Former and Purcher subheads exist
  console.log("\n🔍 Verifying subheads...");
  const formerSubhead = await prisma.account_sub_head.findFirst({
    where: {
      subhead_nam: {
        equals: "Farmer",
        mode: "insensitive",
      },
    },
  });
  const purcherSubhead = await prisma.account_sub_head.findFirst({
    where: {
      subhead_nam: {
        equals: "Purchaser",
        mode: "insensitive",
      },
    },
  });

  if (formerSubhead) {
    console.log(
      `✅ Farmer subhead exists: sub_id=${formerSubhead.sub_id}, subhead_id=${formerSubhead.subhead_id}`,
    );
  } else {
    console.log("❌ Farmer subhead NOT found!");
  }

  if (purcherSubhead) {
    console.log(
      `✅ Purchaser subhead exists: sub_id=${purcherSubhead.sub_id}, subhead_id=${purcherSubhead.subhead_id}`,
    );
  } else {
    console.log("❌ Purchaser subhead NOT found!");
  }

  console.log("\n✅ Seed completed!");
  console.log(
    "⚠️  Note: If you're using Redis caching, restart your server or wait for cache TTL to expire.",
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
