import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import AccountsRepository from "@/app/repositories/account/accounts/accountsRepository";
import RedisService from "@/app/utils/redis";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";
import prisma from "@/lib/prisma";

export async function createTransactions(unitExpense, supplierId, tx) {
  // Validate unit expense object
  if (!unitExpense || !unitExpense.expense_id) {
    throw new Error("Invalid unit expense object provided to createTransactions");
  }

  if (!supplierId) {
    throw new Error("Supplier ID is required for creating transactions");
  }

  try {
    const transactionData = [];
    const prismaClient = tx || prisma;

    const financialYear = calculateFinancialYear(
      unitExpense.expense_date instanceof Date
        ? unitExpense.expense_date.toISOString().split("T")[0]
        : new Date(unitExpense.expense_date).toISOString().split("T")[0]
    );

    const expenseDate = unitExpense.expense_date instanceof Date
      ? unitExpense.expense_date
      : new Date(unitExpense.expense_date);

    const expenseConstants = {
      reference_id: unitExpense.expense_id,
      remarks: `Unit Expense#${unitExpense.expense_id}${unitExpense.description ? ` - ${unitExpense.description}` : ""}`,
      financial_year: financialYear,
      reference: "Unit Expense",
      transaction_dat: expenseDate,
      voucher_type: "UE",
    };

    // Get floc information
    const floc = await prismaClient.floc.findUnique({
      where: { floc_id: unitExpense.floc_id },
      include: {
        unit: true,
      },
    });

    if (!floc) {
      throw new Error("Floc not found");
    }

    if (!floc.unit) {
      throw new Error("Unit not found for floc");
    }

    // Find Floc subhead
    const flocSubhead = await AccountSubHeadRepository.findByName("Floc", tx);
    if (!flocSubhead) {
      throw new Error("Floc subhead not found. Please create a floc first.");
    }

    // Find floc account by matching floc account name pattern: "UnitName - Floc #floc_id"
    const flocAccountName = `${floc.unit.prounit_nam} - Floc #${floc.floc_id}`;
    const flocAccount = await prismaClient.accounts.findFirst({
      where: {
        sub_id: flocSubhead.sub_id,
        account_nam: {
          equals: flocAccountName,
          mode: 'insensitive',
        },
        status: 1,
      },
    });

    if (!flocAccount) {
      throw new Error(`Floc account not found for floc: ${flocAccountName}`);
    }

    // Get supplier account
    const supplierAccount = await prismaClient.accounts.findUnique({
      where: { acc_id: Number(supplierId) },
    });

    if (!supplierAccount) {
      throw new Error("Supplier account not found");
    }

    // Debit floc account (expense added to floc)
    if (unitExpense.total > 0) {
      transactionData.push({
        acc_id: flocAccount.acc_id,
        debit: unitExpense.total,
        credit: 0,
        ...expenseConstants,
      });
    }

    // Credit supplier account (expense against supplier)
    if (unitExpense.total > 0) {
      transactionData.push({
        acc_id: supplierAccount.acc_id,
        debit: 0,
        credit: unitExpense.total,
        ...expenseConstants,
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

    // Return success indicator
    return { success: true, transactionCount: transactionData.length };
  } catch (error) {
    // Log the specific error for debugging
    console.error("Error in createTransactions:", error);
    // Re-throw to trigger transaction rollback
    throw new Error(`Failed to create transactions: ${error.message}`);
  }
}

