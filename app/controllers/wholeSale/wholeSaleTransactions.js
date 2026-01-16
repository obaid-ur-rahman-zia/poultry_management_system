import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import AccountsRepository from "@/app/repositories/account/accounts/accountsRepository";
import RedisService from "@/app/utils/redis";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";
import prisma from "@/lib/prisma";

export async function createTransactions(wholeSale, tx) {
  // Validate wholeSale object
  if (!wholeSale || !wholeSale.sale_id) {
    throw new Error(
      "Invalid wholeSale object provided to createTransactions"
    );
  }

  try {
    const transactionData = [];
    const prismaClient = tx || prisma;

    const financialYear = calculateFinancialYear(
      wholeSale.sale_date instanceof Date
        ? wholeSale.sale_date.toISOString().split("T")[0]
        : new Date(wholeSale.sale_date).toISOString().split("T")[0]
    );

    const wholeSaleConstants = {
      reference_id: wholeSale.sale_id,
      remarks: `Whole Sale#${wholeSale.sale_id}${wholeSale.van_number ? ` Van#${wholeSale.van_number}` : ""}`,
      financial_year: financialYear,
      reference: "Whole Sale",
      voucher_type: "WS",
    };

    // Former account - Debit (payment being taken from)
    // This account is debited because we're taking money from it
    if (wholeSale.former_amount > 0) {
      transactionData.push({
        acc_id: wholeSale.former_account,
        credit: wholeSale.former_amount,
        debit: 0,
        ...wholeSaleConstants,
      });
    }

    // Purcher account - Credit (payment being given to)
    // This account is credited because we're giving money to it
    if (wholeSale.purcher_amount > 0) {
      transactionData.push({
        acc_id: wholeSale.purcher_account,
        credit: 0,
        debit: wholeSale.purcher_amount,
        ...wholeSaleConstants,
      });
    }

    // Calculate profit
    // Based on requirement: "jo minus ho ga wo profit"
    // Profit calculation: If (Purcher - Former) < 0, then profit exists (Former > Purcher)
    // OR if profit field is negative, use that
    const difference = Number(wholeSale.purcher_amount) - Number(wholeSale.former_amount);
    const profitValue = Number(wholeSale.profit) || 0;
    
    console.log("=== PROFIT CALCULATION DEBUG ===");
    console.log("Whole Sale ID:", wholeSale.sale_id);
    console.log("Former Amount:", wholeSale.former_amount);
    console.log("Purcher Amount:", wholeSale.purcher_amount);
    console.log("Profit Value (from DB):", profitValue);
    console.log("Difference (Purcher - Former):", difference);
    
    // Determine profit amount to credit to Sale account
    // Based on requirement: "jo minus ho ga wo profit"
    // AND also handle standard case: if difference > 0 (Purcher > Former), that's profit
    // Profit calculation options:
    // 1. If profit field is negative: use abs(profitValue) - per requirement "jo minus ho ga wo profit"
    // 2. If difference < 0 (Former > Purcher): profit = abs(difference) - per requirement
    // 3. If difference > 0 (Purcher > Former): profit = difference - standard profit case (like trading)
    let profitAmount = 0;
    
    // Priority 1: Use profit field if it's negative (profit exists per requirement)
    if (profitValue < 0) {
      profitAmount = Math.abs(profitValue);
      console.log("✓ Using profit field value (negative):", profitValue, "→ Amount:", profitAmount);
    }
    // Priority 2: Use profit field if it's positive (fallback case)
    else if (profitValue > 0) {
      profitAmount = profitValue;
      console.log("✓ Using profit field value (positive):", profitValue, "→ Amount:", profitAmount);
    }
    // Priority 3: If profit field is 0, check calculated difference
    else {
      // If difference is negative (Former > Purcher), that's profit per requirement
      if (difference < 0) {
        profitAmount = Math.abs(difference);
        console.log("✓ Using calculated difference (negative, Former > Purcher):", difference, "→ Amount:", profitAmount);
      }
      // If difference is positive (Purcher > Former), that's also profit (standard case)
      else if (difference > 0) {
        profitAmount = difference;
        console.log("✓ Using calculated difference (positive, Purcher > Former):", difference, "→ Amount:", profitAmount);
      }
      else {
        console.log("✗ No profit found. profitValue:", profitValue, "difference:", difference, "(both are 0)");
      }
    }

    // Always add profit transaction to Income account if profit exists (same as trading)
    if (profitAmount > 0) {
      console.log("Creating profit transaction for amount:", profitAmount);
      // Find or create "Income" subhead (same as trading)
      console.log("Looking for 'Income' subhead...");
      let incomeSubhead = await AccountSubHeadRepository.findByName("Income", tx);

      if (!incomeSubhead) {
        console.log("Income subhead not found, creating new one...");
        // Get first account head to use for the subhead
        const firstHead = await prismaClient.account_head.findFirst({
          orderBy: { head_id: "asc" },
        });

        if (!firstHead) {
          throw new Error(
            "No account head found. Please create an account head first."
          );
        }

        // Get the max subhead_id for this head_id
        const maxSubhead = await prismaClient.account_sub_head.findFirst({
          where: { head_id: firstHead.head_id },
          orderBy: { subhead_id: "desc" },
          select: { subhead_id: true },
        });

        const nextSubheadId = maxSubhead ? maxSubhead.subhead_id + 1 : 1;

        // Create the Income subhead
        incomeSubhead = await prismaClient.account_sub_head.create({
          data: {
            head_id: firstHead.head_id,
            subhead_id: nextSubheadId,
            subhead_nam: "Income",
            is_parent: 0,
            parent_sub_id: null,
            insert_by: "system",
            update_by: "system",
            status: 1,
          },
        });
        console.log("Created Income subhead with sub_id:", incomeSubhead.sub_id);
      } else {
        console.log("Found existing Income subhead with sub_id:", incomeSubhead.sub_id);
      }

      // Find or create "Income Acc" account in the Income subhead (same as trading)
      console.log("Looking for 'Income Acc' account...");
      let incomeAccount =
        await AccountsRepository.findByAccountNameAndSubheadName(
          "Income Acc",
          "Income",
          tx
        );

      if (!incomeAccount) {
        console.log("Income Acc account not found, creating new one...");
        // Get the max account_id for this sub_id
        const maxAccount = await prismaClient.accounts.findFirst({
          where: { sub_id: incomeSubhead.sub_id },
          orderBy: { account_id: "desc" },
          select: { account_id: true },
        });

        const nextAccountId = maxAccount ? maxAccount.account_id + 1 : 1;

        // Create the Income Acc account
        incomeAccount = await prismaClient.accounts.create({
          data: {
            head_id: incomeSubhead.head_id,
            sub_id: incomeSubhead.sub_id,
            account_id: nextAccountId,
            account_nam: "Income Acc",
            insert_by: "system",
            update_by: "system",
            status: 1,
          },
        });
        console.log("Created Income Acc account with acc_id:", incomeAccount.acc_id);
      } else {
        console.log("Found existing Income Acc account with acc_id:", incomeAccount.acc_id);
      }

      // Add transaction to credit Income account with the profit (same as trading)
      const profitTransaction = {
        acc_id: incomeAccount.acc_id,
        debit: 0,
        credit: profitAmount,
        ...wholeSaleConstants,
        remarks: `${wholeSaleConstants.remarks} - Profit`,
      };
      transactionData.push(profitTransaction);
      console.log("Profit transaction added to transactionData array:", profitTransaction);
      console.log("Total transactions to create:", transactionData.length);
    } else {
      console.log("No profit to credit. profitAmount is 0 or negative.");
    }

    // Validate that we have at least the required transactions
    if (transactionData.length === 0) {
      throw new Error("No transactions to create");
    }

    // Create all transactions - any failure will throw and rollback the entire transaction
    // This ensures atomicity: if any transaction fails, nothing is saved
    console.log("=== CREATING TRANSACTIONS ===");
    console.log("Total transactions to create:", transactionData.length);
    for (let i = 0; i < transactionData.length; i++) {
      const data = transactionData[i];
      console.log(`Creating transaction ${i + 1}/${transactionData.length}:`, {
        acc_id: data.acc_id,
        debit: data.debit,
        credit: data.credit,
        reference: data.reference,
        reference_id: data.reference_id,
        remarks: data.remarks,
      });
      try {
        const result = await transactionRepository.create(data, tx);
        if (!result || !result.t_id) {
          throw new Error(`Failed to create transaction ${i + 1}/${transactionData.length} for account ${data.acc_id}`);
        }
        console.log(`Transaction ${i + 1} created successfully with t_id:`, result.t_id);
      } catch (error) {
        // Log detailed error information
        console.error(`Error creating transaction ${i + 1}/${transactionData.length}:`, {
          account: data.acc_id,
          debit: data.debit,
          credit: data.credit,
          reference: data.reference,
          reference_id: data.reference_id,
          error: error.message,
        });
        throw new Error(`Failed to create transaction: ${error.message}`);
      }
    }
    console.log("=== ALL TRANSACTIONS CREATED SUCCESSFULLY ===");

    // Note: Redis cache clearing should be done AFTER transaction commits
    // We'll clear cache in the controller after transaction succeeds

    // Return success indicator
    return { success: true, transactionCount: transactionData.length };
  } catch (error) {
    // Log the specific error for debugging
    console.error("Error in createTransactions:", error);
    // Re-throw to trigger transaction rollback
    throw new Error(`Failed to create transactions: ${error.message}`);
  }
}
