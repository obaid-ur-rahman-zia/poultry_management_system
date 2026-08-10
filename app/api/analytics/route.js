import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/app/utils/response";

const ALLOWED_DAYS = new Set([1, 7, 30]);

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildDailyBuckets(startDate, days, transactions, trades) {
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + index);
    return {
      date: getDateKey(date),
      debit: 0,
      credit: 0,
      buy: 0,
      sale: 0,
    };
  });
  const bucketByDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));

  transactions.forEach((transaction) => {
    const bucket = bucketByDate.get(getDateKey(transaction.transaction_dat));
    if (bucket) {
      bucket.debit += Number(transaction.debit) || 0;
      bucket.credit += Number(transaction.credit) || 0;
    }
  });

  trades.forEach((trade) => {
    const bucket = bucketByDate.get(getDateKey(trade.trading_date));
    if (bucket) {
      bucket.buy += Number(trade.buy_total) || 0;
      bucket.sale += Number(trade.sale_total) || 0;
    }
  });

  return buckets;
}

export async function GET(request) {
  try {
    const requestedDays = Number(
      new URL(request.url).searchParams.get("days") || 1,
    );
    const days = ALLOWED_DAYS.has(requestedDays) ? requestedDays : 1;

    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    endDate.setDate(endDate.getDate() + 1);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const dateRange = (field) => ({
      [field]: {
        gte: startDate,
        lt: endDate,
      },
    });

    const [transactions, trades, unitSales, unitExpenses] = await Promise.all([
      prisma.transaction.findMany({
        where: { ...dateRange("transaction_dat"), isDeleted: false },
        select: { transaction_dat: true, debit: true, credit: true, voucher_type: true },
      }),
      prisma.trading.findMany({
        where: { ...dateRange("trading_date"), status: 1 },
        select: { trading_date: true, buy_total: true, sale_total: true },
      }),
      prisma.unit_sale.findMany({
        where: { ...dateRange("sale_date"), status: 1 },
        select: { total: true },
      }),
      prisma.unit_expense.findMany({
        where: { ...dateRange("expense_date"), status: 1 },
        select: { total: true },
      }),
    ]);

    const totalDebit = transactions.reduce(
      (sum, transaction) => sum + (Number(transaction.debit) || 0),
      0,
    );
    const totalCredit = transactions.reduce(
      (sum, transaction) => sum + (Number(transaction.credit) || 0),
      0,
    );
    const totalBuyAmount = trades.reduce(
      (sum, trade) => sum + (Number(trade.buy_total) || 0),
      0,
    );
    const totalSaleAmount = trades.reduce(
      (sum, trade) => sum + (Number(trade.sale_total) || 0),
      0,
    );
    const totalUnitSales = unitSales.reduce(
      (sum, sale) => sum + (Number(sale.total) || 0),
      0,
    );
    const totalUnitExpenses = unitExpenses.reduce(
      (sum, expense) => sum + (Number(expense.total) || 0),
      0,
    );

    const transactionTypeData = [
      ["Cash Receipt", "CR", "#10b981"],
      ["Cash Payment", "CP", "#ef4444"],
      ["Bank Receipt", "BR", "#3b82f6"],
      ["Bank Payment", "BP", "#f59e0b"],
      ["Journal Voucher", "JV", "#8b5cf6"],
    ]
      .map(([name, voucherType, color]) => ({
        name,
        value: transactions.filter(
          (transaction) => transaction.voucher_type === voucherType,
        ).length,
        color,
      }))
      .filter((item) => item.value > 0);

    return successResponse(
      {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        metrics: {
          totalDebit,
          totalCredit,
          netBalance: totalDebit - totalCredit,
          totalBuyAmount,
          totalSaleAmount,
          tradingProfit: totalSaleAmount - totalBuyAmount,
          totalUnitSales,
          totalUnitExpenses,
          unitNetProfit: totalUnitSales - totalUnitExpenses,
        },
        counts: {
          debitTransactions: transactions.filter((transaction) => transaction.debit > 0).length,
          creditTransactions: transactions.filter((transaction) => transaction.credit > 0).length,
          trades: trades.length,
          unitSales: unitSales.length,
          unitExpenses: unitExpenses.length,
        },
        transactionTypeData,
        dailyData: buildDailyBuckets(startDate, days, transactions, trades),
      },
      "Dashboard analytics fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return errorResponse(error, 500);
  }
}
