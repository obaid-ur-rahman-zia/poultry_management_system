import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import AccountsRepository from "@/app/repositories/account/accounts/accountsRepository";
import RedisService from "@/app/utils/redis";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";
import prisma from "@/lib/prisma";

export async function createTransactions(unitSale, customerId, tx) {
  // Validate unit sale object
  if (!unitSale || !unitSale.sale_id) {
    throw new Error("Invalid unit sale object provided to createTransactions");
  }

  if (!customerId) {
    throw new Error("Customer ID is required for creating transactions");
  }

  try {
    const transactionData = [];
    const prismaClient = tx || prisma;

    const financialYear = calculateFinancialYear(
      unitSale.sale_date instanceof Date
        ? unitSale.sale_date.toISOString().split("T")[0]
        : new Date(unitSale.sale_date).toISOString().split("T")[0]
    );

    const saleDate = unitSale.sale_date instanceof Date
      ? unitSale.sale_date
      : new Date(unitSale.sale_date);

    const saleConstants = {
      reference_id: unitSale.sale_id,
      remarks: `Unit Sale#${unitSale.sale_id}${unitSale.description ? ` - ${unitSale.description}` : ""}`,
      financial_year: financialYear,
      reference: "Unit Sale",
      transaction_dat: saleDate,
    };

    // Get unit information
    const unit = await prismaClient.pro_unit.findUnique({
      where: { prounit_id: unitSale.prounit_id },
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

    // Get customer account
    const customerAccount = await prismaClient.accounts.findUnique({
      where: { acc_id: Number(customerId) },
    });

    if (!customerAccount) {
      throw new Error("Customer account not found");
    }

    // Debit customer account (income from customer)
    if (unitSale.total > 0) {
      transactionData.push({
        acc_id: customerAccount.acc_id,
        debit: unitSale.total,
        credit: 0,
        ...saleConstants,
      });
    }

    // Credit unit account (income added to unit)
    if (unitSale.total > 0) {
      transactionData.push({
        acc_id: unitAccount.acc_id,
        debit: 0,
        credit: unitSale.total,
        ...saleConstants,
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

