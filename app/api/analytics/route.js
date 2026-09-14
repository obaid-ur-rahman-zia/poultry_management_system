import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/app/utils/response";

const ALLOWED_DAYS = new Set([1, 7, 30]);

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildDailyBuckets(startDate, days, wholeSales, localSales, oppositeTrans, selfTrans) {
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + index);
    return {
      date: getDateKey(date),
      wholesaleWeight: 0,
      localSaleWeight: 0,
      wholesaleAmount: 0,
      localSaleAmount: 0,
      selfTransactions: 0,
      oppositeTransactions: 0,
    };
  });
  const bucketByDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));

  wholeSales.forEach((ws) => {
    const bucket = bucketByDate.get(getDateKey(ws.sale_date));
    if (bucket) {
      bucket.wholesaleWeight += Number(ws.weight) || 0;
      bucket.wholesaleAmount += Number(ws.purcher_amount) || 0;
    }
  });

  localSales.forEach((ls) => {
    const bucket = bucketByDate.get(getDateKey(ls.local_sale_date));
    if (bucket) {
      bucket.localSaleWeight += Number(ls.purchaser_weight) || 0;
      bucket.localSaleAmount += Number(ls.purchaser_amount) || 0;
    }
  });

  oppositeTrans.forEach((t) => {
    const bucket = bucketByDate.get(getDateKey(t.transaction_date));
    if (bucket) {
      bucket.oppositeTransactions += Number(t.amount) || 0;
    }
  });

  selfTrans.forEach((t) => {
    const bucket = bucketByDate.get(getDateKey(t.transaction_date));
    if (bucket) {
      bucket.selfTransactions += Number(t.amount) || 0;
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

    const [wholeSales, localSales, oppositeTrans, selfTrans] = await Promise.all([
      prisma.whole_sale.findMany({
        where: { ...dateRange("sale_date"), status: 1 },
        select: { sale_date: true, former_amount: true, purcher_amount: true, weight: true, profit: true },
      }),
      prisma.local_sale.findMany({
        where: { ...dateRange("local_sale_date"), status: 1 },
        select: { local_sale_date: true, purchaser_weight: true, purchaser_amount: true, received_amount: true },
      }),
      prisma.opposite_transaction.findMany({
        where: { ...dateRange("transaction_date"), status: 1 },
        select: { transaction_date: true, amount: true },
      }),
      prisma.self_transaction.findMany({
        where: { ...dateRange("transaction_date"), status: 1 },
        select: { transaction_date: true, amount: true },
      }),
    ]);

    const wholesaleMetrics = wholeSales.reduce(
      (acc, ws) => {
        acc.totalPurchase += (Number(ws.former_amount) || 0);
        acc.totalSale += (Number(ws.purcher_amount) || 0);
        acc.totalWeight += (Number(ws.weight) || 0);
        acc.totalProfit += (Number(ws.profit) || 0);
        return acc;
      },
      { totalPurchase: 0, totalSale: 0, totalWeight: 0, totalProfit: 0 }
    );

    const localSaleMetrics = localSales.reduce(
      (acc, ls) => {
        acc.totalWeight += (Number(ls.purchaser_weight) || 0);
        acc.totalAmount += (Number(ls.purchaser_amount) || 0);
        acc.totalReceived += (Number(ls.received_amount) || 0);
        return acc;
      },
      { totalWeight: 0, totalAmount: 0, totalReceived: 0 }
    );

    return successResponse(
      {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        metrics: {
          wholesale: wholesaleMetrics,
          localSale: localSaleMetrics,
        },
        counts: {
          wholeSales: wholeSales.length,
          localSales: localSales.length,
        },
        dailyData: buildDailyBuckets(startDate, days, wholeSales, localSales, oppositeTrans, selfTrans),
      },
      "Dashboard analytics fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return errorResponse(error, 500);
  }
}
