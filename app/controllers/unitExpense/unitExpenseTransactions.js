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
    };

    // Get unit information
    const unit = await prismaClient.pro_unit.findUnique({
      where: { prounit_id: unitExpense.prounit_id },
    });

    if (!unit) {
      throw new Error("Unit not found");
    }

    // Find Unit subhead
    const unitSubhead = await AccountSubHeadRepository.findByName("Unit", tx);
    if (!unitSubhead) {
      throw new Error("Unit subhead not found. Please create a unit first.");
    }

    // Find unit account by matching unit name
    const unitAccount = await prismaClient.accounts.findFirst({
      where: {
        sub_id: unitSubhead.sub_id,
        account_nam: {
          equals: unit.prounit_nam,
          mode: 'insensitive',
        },
        status: 1,
      },
    });

    if (!unitAccount) {
      throw new Error(`Unit account not found for unit: ${unit.prounit_nam}`);
    }

    // Get supplier account
    const supplierAccount = await prismaClient.accounts.findUnique({
      where: { acc_id: Number(supplierId) },
    });

    if (!supplierAccount) {
      throw new Error("Supplier account not found");
    }

    // Debit unit account (expense added to unit)
    if (unitExpense.total > 0) {
      transactionData.push({
        acc_id: unitAccount.acc_id,
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

