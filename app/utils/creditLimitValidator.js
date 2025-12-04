import TransactionRepository from "@/app/repositories/transaction/transactionRepository";
import AccountsRepository from "@/app/repositories/account/accounts/accountsRepository";

/**
 * Check if a transaction would exceed the credit limit for an account
 * Credit limit represents the maximum total receivable amount (accumulated balance)
 * @param {number} acc_id - Account ID
 * @param {number} creditAmount - Amount to be credited (will increase receivable)
 * @param {number} debitAmount - Amount to be debited (will decrease receivable)
 * @param {Object} tx - Optional transaction client
 * @returns {Promise<{allowed: boolean, currentBalance: number, creditLimit: number|null, message: string}>}
 */
export async function checkCreditLimit(acc_id, creditAmount = 0, debitAmount = 0, tx = null) {
  try {
    // Get account details (pass transaction client if provided)
    const account = await AccountsRepository.readById(acc_id, tx);
    
    if (!account) {
      return {
        allowed: false,
        currentBalance: 0,
        creditLimit: null,
        message: "Account not found",
      };
    }

    // If credit_limit is null, it means unlimited credit
    if (account.credit_limit === null || account.credit_limit === undefined) {
      return {
        allowed: true,
        currentBalance: 0,
        creditLimit: null,
        message: "Unlimited credit",
      };
    }

    // Get current balance (all transactions)
    const balanceResult = await TransactionRepository.getBalance(acc_id);
    const totalDebit = Number(balanceResult._sum.debit) || 0;
    const totalCredit = Number(balanceResult._sum.credit) || 0;
    
    // Balance = Debit - Credit
    // Positive balance = debit balance (we owe them or they have positive balance)
    // Negative balance = credit balance (they owe us - this is what we track for credit limit)
    const currentBalance = totalDebit - totalCredit;

    // Calculate current receivable (credit balance)
    // If balance is negative, they owe us (receivable)
    // If balance is positive or zero, they don't owe us (no receivable or we owe them)
    const currentReceivable = currentBalance < 0 ? Math.abs(currentBalance) : 0;

    // Calculate net change from this transaction
    // Credit increases receivable (they owe us more)
    // Debit decreases receivable (they owe us less or we owe them)
    const netChange = creditAmount - debitAmount;

    // Calculate new receivable after this transaction
    // If netChange is positive, receivable increases
    // If netChange is negative, receivable decreases (or becomes negative, meaning we owe them)
    const newReceivable = currentReceivable + netChange;

    // Credit limit is the maximum receivable amount
    // We only care if the receivable exceeds the limit (newReceivable > creditLimit)
    // If newReceivable is negative, it means we owe them, so no limit check needed
    const creditLimit = Number(account.credit_limit) || 0;
    const allowed = newReceivable <= creditLimit || newReceivable < 0;

    return {
      allowed,
      currentBalance,
      currentReceivable,
      newReceivable,
      creditLimit,
      netChange,
      message: allowed
        ? "Transaction allowed"
        : `Credit limit exceeded. Current receivable: ${currentReceivable.toFixed(2)}, Credit limit: ${creditLimit.toFixed(2)}, Transaction will result in receivable of: ${newReceivable.toFixed(2)}`,
    };
  } catch (error) {
    console.error("Error checking credit limit:", error);
    return {
      allowed: false,
      currentBalance: 0,
      creditLimit: null,
      message: `Error checking credit limit: ${error.message}`,
    };
  }
}

/**
 * Validate that credit limit is >= opening balance
 * @param {number|null} creditLimit - Credit limit value
 * @param {number} openingBalance - Opening balance value
 * @param {string} balanceType - "debit" or "credit"
 * @returns {Object} {valid: boolean, message: string}
 */
export function validateCreditLimitVsOpeningBalance(creditLimit, openingBalance, balanceType) {
  // If credit limit is null, it's unlimited, so always valid
  if (creditLimit === null || creditLimit === undefined) {
    return { valid: true, message: "Unlimited credit limit" };
  }

  // If opening balance is 0 or not provided, no validation needed
  if (!openingBalance || openingBalance === 0) {
    return { valid: true, message: "No opening balance" };
  }

  const absoluteBalance = Math.abs(openingBalance);
  const creditLimitNum = Number(creditLimit) || 0;

  // For credit balance (balanceType === "credit"), the opening balance increases the credit
  // For debit balance (balanceType === "debit"), the opening balance doesn't affect credit limit
  if (balanceType === "credit") {
    if (absoluteBalance > creditLimitNum) {
      return {
        valid: false,
        message: `Credit limit (${creditLimitNum}) must be greater than or equal to opening balance (${absoluteBalance})`,
      };
    }
  }

  return { valid: true, message: "Credit limit validation passed" };
}

