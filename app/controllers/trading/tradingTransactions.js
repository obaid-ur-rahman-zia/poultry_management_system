import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import AccountsRepository from "@/app/repositories/account/accounts/accountsRepository";
import RedisService from "@/app/utils/redis";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";
import prisma from "@/lib/prisma";

export async function createTransactions(trading, tx) {
  // Validate trading object
  if (!trading || !trading.trading_id) {
    throw new Error("Invalid trading object provided to createTransactions");
  }

  try {
    const transactionData = [];
    const prismaClient = tx || prisma;

    const financialYear = calculateFinancialYear(
      trading.trading_date instanceof Date
        ? trading.trading_date.toISOString().split("T")[0]
        : new Date(trading.trading_date).toISOString().split("T")[0]
    );

    const tradingConstants = {
      reference_id: trading.trading_id,
      remarks: `Trading#${trading.trading_id}${trading.do_number ? ` DO#${trading.do_number}` : ""}`,
      financial_year: financialYear,
      reference: "Trading",
      voucher_type: "TR",
    };

    // Buy from account - Debit (payment being taken from)
    // This account is debited because we're taking money from it
    if (trading.buy_total > 0) {
      transactionData.push({
        acc_id: trading.buy_from_account,
        credit: trading.buy_total,
        debit: 0,
        ...tradingConstants,
      });
    }

    // Sale to account - Credit (payment being given to)
    // This account is credited because we're giving money to it
    if (trading.sale_total > 0) {
      transactionData.push({
        acc_id: trading.sale_to_account,
        credit: 0,
        debit: trading.sale_total,
        ...tradingConstants,
      });
    }

    // Calculate the difference (profit) between sale_total and buy_total
    const difference = Number(trading.sale_total) - Number(trading.buy_total);
    
    // If there's a profit (positive difference), add it to income account
    if (difference > 0) {
      // Find or create "Income" subhead
      let incomeSubhead = await AccountSubHeadRepository.findByName("Income", tx);
      
      if (!incomeSubhead) {
        // Get first account head to use for the subhead
        const firstHead = await prismaClient.account_head.findFirst({
          orderBy: { head_id: "asc" },
        });

        if (!firstHead) {
          throw new Error("No account head found. Please create an account head first.");
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

      // Find or create "Income Acc" account in the Income subhead
      let incomeAccount = await AccountsRepository.findByAccountNameAndSubheadName("Income Acc", "Income", tx);
      
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

      // Add transaction to credit income account with the profit
      transactionData.push({
        acc_id: incomeAccount.acc_id,
        debit: 0,
        credit: difference,
        ...tradingConstants,
        remarks: `${tradingConstants.remarks} - Profit`,
      });
    }

    // Create all transactions - any failure will throw and rollback
    for (const data of transactionData) {
      const result = await transactionRepository.create(data, tx);
      if (!result) {
        throw new Error(`Failed to create transaction`);
      }
    }

    await RedisService.del("transactions:all");
    await RedisService.del("accountSubHeads:all");
    await RedisService.del("accounts:all");

    // Return success indicator
    return { success: true, transactionCount: transactionData.length };
  } catch (error) {
    // Log the specific error for debugging
    console.error("Error in createTransactions:", error);
    // Re-throw to trigger transaction rollback
    throw new Error(`Failed to create transactions: ${error.message}`);
  }
}

