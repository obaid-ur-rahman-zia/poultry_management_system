import prisma from "@/lib/prisma";

export default class ShopReportRepository {
  /**
   * Trial Balance: Totals per customer for a given shop up to a specific date.
   */
  static async readTrialBalance({ shop_acc_id, end_dat }) {
    if (!shop_acc_id || !end_dat) {
      throw new Error("shop_acc_id and end_dat are required");
    }

    const endOfDay = new Date(end_dat);
    endOfDay.setHours(23, 59, 59, 999);

    const parsedShopId = Number(shop_acc_id);

    // Fetch all customers that have at least one sale for this shop up to the given date
    const customers = await prisma.shop_customer.findMany({
      where: {
        shop_sales: {
          some: {
            shop_acc_id: parsedShopId,
            sale_date: { lte: endOfDay },
          },
        },
      },
      include: {
        shop_sales: {
          where: {
            shop_acc_id: parsedShopId,
            sale_date: { lte: endOfDay },
          },
        },
      },
      orderBy: {
        customer_nam: "asc",
      },
    });

    const report = customers.map((customer) => {
      let total_qty = 0;
      let total_amount = 0;
      let total_received = 0;

      customer.shop_sales.forEach((sale) => {
        total_qty += Number(sale.qty || 0);
        total_amount += Number(sale.amount || 0);
        total_received += Number(sale.received_amount || 0);
      });

      const balance = total_amount - total_received;

      return {
        customer_id: customer.customer_id,
        customer_nam: customer.customer_nam,
        total_qty,
        total_amount,
        total_received,
        balance,
      };
    });

    return report;
  }

  /**
   * Sale Detail: Date-wise grouped report with stock summaries.
   */
  static async readSaleDetail({ shop_acc_id, start_dat, end_dat }) {
    if (!shop_acc_id || !start_dat || !end_dat) {
      throw new Error("shop_acc_id, start_dat, and end_dat are required");
    }

    const parsedShopId = Number(shop_acc_id);
    const startDate = new Date(start_dat);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end_dat);
    endDate.setHours(23, 59, 59, 999);

    // Generate date array
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const report = [];

    // Optimize: fetch all required local sales for the shop in range
    const localSales = await prisma.local_sale.findMany({
      where: {
        purchaser_account: parsedShopId,
        local_sale_dat: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        local_sale_dat: true,
        purchaser_weight: true,
      },
    });

    // Optimize: fetch all required shop sales for the shop in range
    const shopSales = await prisma.shop_sale.findMany({
      where: {
        shop_acc_id: parsedShopId,
        sale_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        sale_date: "asc",
      },
    });

    // Optimize: fetch all closing stocks for the shop in range
    const closingStocks = await prisma.shop_closing_stock.findMany({
      where: {
        shop_acc_id: parsedShopId,
        closing_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Determine initial opening stock before the start date
    const initialOpeningStockEntry = await prisma.shop_closing_stock.findFirst({
      where: {
        shop_acc_id: parsedShopId,
        closing_date: { lt: startDate },
      },
      orderBy: {
        closing_date: "desc",
      },
    });
    
    let rollingOpeningStock = initialOpeningStockEntry ? Number(initialOpeningStockEntry.closing_weight) : 0;

    for (const d of dates) {
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);
      const dateStr = startOfDay.toISOString().split("T")[0];

      // 1. Opening Stock
      const openingStock = rollingOpeningStock;

      // 2. Purchase Stock (sum of local sales that day)
      const purchasesThatDay = localSales.filter(ls => {
        const lsDate = new Date(ls.local_sale_dat);
        return lsDate >= startOfDay && lsDate <= endOfDay;
      });
      const purchaseStock = purchasesThatDay.reduce((sum, ls) => sum + Number(ls.purchaser_weight || 0), 0);

      // 3. Total Stock
      const totalStock = openingStock + purchaseStock;

      // 4. Closing Stock
      const closingStockEntry = closingStocks.find(cs => {
        const csDate = new Date(cs.closing_date);
        return csDate >= startOfDay && csDate <= endOfDay;
      });
      const closingStock = closingStockEntry ? Number(closingStockEntry.closing_weight) : null;

      // Update rolling opening stock for the next day
      if (closingStock !== null) {
        rollingOpeningStock = closingStock;
      }

      // 5. Sales that day
      const salesThatDay = shopSales.filter(s => {
        const sDate = new Date(s.sale_date);
        return sDate >= startOfDay && sDate <= endOfDay;
      });

      const saledStock = salesThatDay.reduce((sum, sale) => sum + Number(sale.qty || 0), 0);
      
      const dateTotalAmount = salesThatDay.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
      const dateTotalReceived = salesThatDay.reduce((sum, sale) => sum + Number(sale.received_amount || 0), 0);

      report.push({
        dateStr,
        stockSummary: {
          openingStock,
          purchaseStock,
          totalStock,
          closingStock,
          saledStock,
        },
        sales: salesThatDay.map(s => ({
          sale_id: s.shop_sale_id,
          customer_name: s.customer?.customer_nam || "N/A",
          qty: Number(s.qty || 0),
          rate: Number(s.rate || 0),
          amount: Number(s.amount || 0),
          received: Number(s.received_amount || 0),
        })),
        dateTotals: {
          qty: saledStock,
          amount: dateTotalAmount,
          received: dateTotalReceived,
        }
      });
    }

    // Note: We only keep dates that have either stock changes or sales, otherwise we might return too many empty days
    // But since the report specifically shows daily stock progression, keeping all dates in range might be better.
    // Let's filter out completely empty days to avoid massive blank reports for large date ranges where nothing happened.
    const filteredReport = report.filter(
      day => day.sales.length > 0 || day.stockSummary.purchaseStock > 0 || day.stockSummary.closingStock !== null
    );

    return filteredReport;
  }
}
