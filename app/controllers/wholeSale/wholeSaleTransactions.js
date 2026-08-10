import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import AccountsRepository from "@/app/repositories/account/accounts/accountsRepository";
import RedisService from "@/app/utils/redis";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";
import prisma from "@/lib/prisma";

export async function createTransactions(wholeSale, tx) {
  // Validate wholeSale object
  if (!wholeSale || !wholeSale.sale_id) {
    throw new Error("Invalid wholeSale object provided to createTransactions");
  }

  try {
    const transactionData = [];
    const prismaClient = tx || prisma;

    const financialYear = calculateFinancialYear(
      wholeSale.sale_date instanceof Date
        ? wholeSale.sale_date.toISOString().split("T")[0]
        : new Date(wholeSale.sale_date).toISOString().split("T")[0],
    );

    const transactionRemarks = `Weight ${wholeSale.weight} Former Rate @${wholeSale.former_rate} Purcher Rate @${wholeSale.purcher_rate} Whole Sale#${wholeSale.sale_id}${wholeSale.van_number ? ` Van#${wholeSale.van_number}` : ""}`;

    const wholeSaleConstants = {
      reference_id: wholeSale.sale_id,

      financial_year: financialYear,
      reference: "Whole Sale",
      voucher_type: "WS",
      remarks: transactionRemarks,
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

    // The balancing adjustment is derived from the two account entries above.
    // A positive difference is income; a negative difference is a loss.
    const difference =
      Number(wholeSale.purcher_amount) - Number(wholeSale.former_amount);
    const profitAmount = Math.abs(difference);

    if (profitAmount > 0) {
      let incomeSubhead = await AccountSubHeadRepository.findByName(
        "Income",
        tx,
      );

      if (!incomeSubhead) {
        // Get first account head to use for the subhead
        const firstHead = await prismaClient.account_head.findFirst({
          orderBy: { head_id: "asc" },
        });

        if (!firstHead) {
          throw new Error(
            "No account head found. Please create an account head first.",
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
      }

      let incomeAccount =
        await AccountsRepository.findByAccountNameAndSubheadName(
          "Income Acc",
          "Income",
          tx,
        );

      if (!incomeAccount) {
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
      }

      const adjustmentTransaction = {
        acc_id: incomeAccount.acc_id,
        debit: difference < 0 ? profitAmount : 0,
        credit: difference > 0 ? profitAmount : 0,
        ...wholeSaleConstants,
        remarks: `${wholeSaleConstants.remarks} - ${difference < 0 ? "Loss" : "Profit"}`,
      };
      transactionData.push(adjustmentTransaction);
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
          throw new Error(
            `Failed to create transaction ${i + 1}/${transactionData.length} for account ${data.acc_id}`,
          );
        }
        console.log(
          `Transaction ${i + 1} created successfully with t_id:`,
          result.t_id,
        );
      } catch (error) {
        // Log detailed error information
        console.error(
          `Error creating transaction ${i + 1}/${transactionData.length}:`,
          {
            account: data.acc_id,
            debit: data.debit,
            credit: data.credit,
            reference: data.reference,
            reference_id: data.reference_id,
            error: error.message,
          },
        );
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
