import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export const calculateFinancialYear = (value) => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

export const reverseDebitCredit = (data) => {
  // Create a shallow copy so the original is not mutated
  const newData = { ...data };

  if ("debit" in newData || "credit" in newData) {
    const tempDebit = newData.debit;
    newData.debit = newData.credit;
    newData.credit = tempDebit;
  }

  return newData;
}


