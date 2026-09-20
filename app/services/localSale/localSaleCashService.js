import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import localSaleRepository from "@/app/repositories/localSale/localSaleRepository";
import localSaleExpenseRepository from "@/app/repositories/localSaleExpense/localSaleExpenseRepository";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";
import ErrorLogger from "@/app/utils/errorLogger";

export async function recalculateAndWriteLocalSaleCash(dateStr, cashAccountId, tx) {
  if (!dateStr) {
    throw new Error("dateStr is required for recalculating local sale cash");
  }
  if (!cashAccountId) {
    throw new Error("cashAccountId is required for recalculating local sale cash");
  }

  // Use the date part if it's an ISO string
  const formattedDate = dateStr instanceof Date 
    ? dateStr.toISOString().split("T")[0] 
    : new Date(dateStr).toISOString().split("T")[0];

  try {
    // 1. Get sum of received amounts for the date
    const totalReceived = await localSaleRepository.sumReceivedByDate(formattedDate, tx);
    
    // 2. Get sum of expenses for the date
    const totalExpenses = await localSaleExpenseRepository.sumAmountByDate(formattedDate, tx);

    // 3. Calculate net
    const net = totalReceived - totalExpenses;

    // 4. Soft delete previous consolidation for this date
    await transactionRepository.softDeleteLocalSaleCashByDate(formattedDate, tx);

    // 5. If net > 0, create the new consolidated ledger entry
    if (net > 0) {
      const financialYear = calculateFinancialYear(formattedDate);
      
      const transactionData = {
        acc_id: cashAccountId,
        credit: 0,
        debit: net,
        remarks: `Local Sale Cash - Consolidated Net of Expenses (${totalReceived} received, ${totalExpenses} expenses)`,
        reference_id: 0,
        financial_year: financialYear,
        reference: "Local Sale Cash",
        voucher_type: "LS",
        transaction_dat: new Date(formattedDate),
        insert_dat: new Date(),
        insert_by: "system", // We can use system here as this is an automated aggregation row
        update_by: "system"
      };

      const result = await transactionRepository.create(transactionData, tx);
      if (!result || !result.t_id) {
        throw new Error(`Failed to create consolidated transaction for cash account ${cashAccountId}`);
      }
    }
  } catch (err) {
    ErrorLogger.log("recalculateAndWriteLocalSaleCash failed", err);
    throw err;
  }
}
