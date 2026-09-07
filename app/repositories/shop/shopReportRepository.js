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
        local_sale_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        local_sale_date: true,
        purchaser_weight: true,
        purchaser_rate: true,
        received_amount: true,
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
        const lsDate = new Date(ls.local_sale_date);
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

      // 6. Local sale info (rate and received amount for financial summary)
      const localSaleRate = purchasesThatDay.length > 0 ? Number(purchasesThatDay[0].purchaser_rate || 0) : 0;
      const localSaleNetReceived = purchasesThatDay.length > 0 ? Number(purchasesThatDay[0].received_amount || 0) : 0;

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
        },
        financialSummary: {
          localSaleRate,
          localSaleNetReceived,
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

  /**
   * Customer Ledger: Fetches opening balance and all transactions for a specific customer.
   */
  static async readCustomerLedger({ customer_id, start_dat, end_dat }) {
    if (!customer_id || !start_dat || !end_dat) {
      throw new Error("customer_id, start_dat, and end_dat are required");
    }

    const parsedCustomerId = Number(customer_id);
    const startDate = new Date(start_dat);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end_dat);
    endDate.setHours(23, 59, 59, 999);

    // Get the most recent transaction BEFORE the start date
    const lastTransaction = await prisma.shop_sale.findFirst({
      where: {
        customer_id: parsedCustomerId,
        sale_date: { lt: startDate },
        status: 1,
      },
      orderBy: [
        { sale_date: "desc" },
        { shop_sale_id: "desc" }
      ],
    });

    const openingBalance = lastTransaction ? Number(lastTransaction.net_balance) : 0;

    const transactions = await prisma.shop_sale.findMany({
      where: {
        customer_id: parsedCustomerId,
        sale_date: {
          gte: startDate,
          lte: endDate,
        },
        status: 1,
      },
      orderBy: [
        { sale_date: "asc" },
        { shop_sale_id: "asc" }
      ],
    });

    // Fetch FS Rates for the date range efficiently
    const fsRatesData = await prisma.whole_sale.findMany({
      where: {
        sale_date: {
          gte: startDate,
          lte: endDate,
        },
        OR: [{ farm_rate: { not: null } }, { sale_rate: { not: null } }],
        status: 1,
      },
      select: {
        sale_date: true,
        farm_rate: true,
        sale_rate: true,
      },
      orderBy: {
        sale_date: "asc"
      }
    });

    const fsRatesMap = {};
    fsRatesData.forEach(rate => {
      const d = new Date(rate.sale_date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const farm = rate.farm_rate || "";
      const sale = rate.sale_rate || "";
      fsRatesMap[dateStr] = farm && sale ? `${farm}-${sale}` : (farm || sale || "-");
    });

    // We can also calculate running balance on the fly to ensure accuracy,
    // though the DB net_balance should be correct if inserted sequentially.
    const reportTransactions = [];
    let currentBalance = openingBalance;

    for (const t of transactions) {
      currentBalance = currentBalance + Number(t.amount || 0) - Number(t.received_amount || 0);
      
      const d = new Date(t.sale_date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      reportTransactions.push({
        shop_sale_id: t.shop_sale_id,
        sale_date: t.sale_date,
        fs_rate: fsRatesMap[dateStr] || "-",
        qty: Number(t.qty || 0),
        rate: Number(t.rate || 0),
        amount: Number(t.amount || 0),
        received_amount: Number(t.received_amount || 0),
        balance: currentBalance,
      });
    }

    return {
      openingBalance,
      transactions: reportTransactions,
    };
  }

  /**
   * Shop Sale Profit Report: Groups purchases and sales by date/month/year to calculate profit.
   */
  static async readShopProfitReport({ shop_acc_id, start_dat, end_dat, group_by }) {
    if (!shop_acc_id || !start_dat || !end_dat) {
      throw new Error("shop_acc_id, start_dat, and end_dat are required");
    }

    const parsedShopId = Number(shop_acc_id);
    const startDate = new Date(start_dat);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end_dat);
    endDate.setHours(23, 59, 59, 999);
    const groupBy = group_by || "date";

    const getGroupKey = (dateStr) => {
      const d = new Date(dateStr);
      if (groupBy === 'year') return `${d.getFullYear()}`;
      if (groupBy === 'month') {
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${d.getFullYear()}-${m}`;
      }
      return d.toISOString().split('T')[0]; // date
    };

    // 1. Fetch Purchases & Net Sale (local_sale where purchaser_account = shop_acc_id)
    const localSales = await prisma.local_sale.findMany({
      where: {
        purchaser_account: parsedShopId,
        local_sale_date: {
          gte: startDate,
          lte: endDate,
        },
        status: 1,
      },
      select: {
        local_sale_date: true,
        purchaser_amount: true,
        received_amount: true, // Net Sale: cash paid to us when stock was transferred to the shop
      },
    });

    // 2. Fetch Sales & Recovery (shop_sale where shop_acc_id = shop_acc_id)
    const shopSales = await prisma.shop_sale.findMany({
      where: {
        shop_acc_id: parsedShopId,
        sale_date: {
          gte: startDate,
          lte: endDate,
        },
        status: 1,
      },
      select: {
        sale_date: true,
        amount: true,
        received_amount: true,
      },
    });

    const groupedData = new Map();

    localSales.forEach((ls) => {
      const key = getGroupKey(ls.local_sale_date);
      if (!groupedData.has(key)) {
        groupedData.set(key, { period: key, purchase_amount: 0, net_sale: 0, sale_amount: 0, recovery: 0 });
      }
      const group = groupedData.get(key);
      group.purchase_amount += Number(ls.purchaser_amount || 0);
      group.net_sale += Number(ls.received_amount || 0); // cash received from shop on that entry
    });

    shopSales.forEach((ss) => {
      const key = getGroupKey(ss.sale_date);
      if (!groupedData.has(key)) {
        groupedData.set(key, { period: key, purchase_amount: 0, net_sale: 0, sale_amount: 0, recovery: 0 });
      }
      const group = groupedData.get(key);
      group.sale_amount += Number(ss.amount || 0);
      group.recovery += Number(ss.received_amount || 0);
    });

    const results = Array.from(groupedData.values()).map(row => {
      return {
        ...row,
        due_sale: row.sale_amount, // alias: total shop sale amount in this period
        profit: row.sale_amount - row.purchase_amount,
      };
    });

    // Sort chronologically
    results.sort((a, b) => a.period.localeCompare(b.period));

    const grandTotalPurchase = results.reduce((sum, row) => sum + row.purchase_amount, 0);
    const grandTotalSale = results.reduce((sum, row) => sum + row.sale_amount, 0);
    const grandTotalNetSale = results.reduce((sum, row) => sum + row.net_sale, 0);
    const grandTotalDueSale = grandTotalSale;
    const grandTotalRecovery = results.reduce((sum, row) => sum + row.recovery, 0);
    const netProfit = grandTotalSale - grandTotalPurchase;

    return {
      results,
      grandTotals: {
        purchase_amount: grandTotalPurchase,
        sale_amount: grandTotalSale,
        net_sale: grandTotalNetSale,
        due_sale: grandTotalDueSale,
        recovery: grandTotalRecovery,
        profit: netProfit,
      }
    };
  }
}
