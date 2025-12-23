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
      voucher_type: "US",
    };

    // Get floc information
    const floc = await prismaClient.floc.findUnique({
      where: { floc_id: unitSale.floc_id },
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

    // Credit floc account (income added to floc)
    if (unitSale.total > 0) {
      transactionData.push({
        acc_id: flocAccount.acc_id,
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

