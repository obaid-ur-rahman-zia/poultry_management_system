import puppeteer from "puppeteer";

export async function generateBalanceSheetReportPDF(
  rawTransactions,
  globalOpeningBalance,
  globalClosingBalance,
  startDate,
  endDate,
  cashAccId
) {
  let browser;

  try {
    console.log("Starting Balance Sheet Report PDF generation...");

    browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    const htmlContent = generateReportHTML(
      rawTransactions,
      globalOpeningBalance,
      globalClosingBalance,
      startDate,
      endDate,
      cashAccId
    );

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "15mm",
        left: "10mm",
      },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 5px;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
      preferCSSPageSize: false,
    });

    return pdfBuffer;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function processTransactions(rawTransactions, globalOpeningBalance, cashAccId) {
  if (!rawTransactions || !rawTransactions.length) return [];

  const grouped = {};
  rawTransactions.forEach((trans) => {
    const dateVal = trans.type === 'local_sale' ? trans.local_sale_date : trans.transaction_date;
    const dateStr = new Date(dateVal).toISOString().split("T")[0];
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(trans);
  });

  const days = [];
  let currentBalance = globalOpeningBalance;
  let globalSrNo = 1;

  Object.keys(grouped)
    .sort()
    .forEach((dateStr) => {
      const dayTransactions = grouped[dateStr];
      const dayOpeningBalance = currentBalance;

      let selfReceiveTransactions = [];
      let selfPayTransactions = [];
      let localSales = [];
      let oppositeTransactions = [];
      let expenseTransactions = [];

      dayTransactions.forEach((trans) => {
        if (trans.type === "self") {
          if (trans.transaction_type === "receive") selfReceiveTransactions.push(trans);
          else if (trans.transaction_type === "pay") selfPayTransactions.push(trans);
        } else if (trans.type === "local_sale") {
          localSales.push(trans);
        } else if (trans.type === "opposite") {
          oppositeTransactions.push(trans);
        } else if (trans.type === "expense") {
          expenseTransactions.push(trans);
        }
      });

      const dayProcessedTransactions = [];
      let dayTotalReceived = 0;
      let dayTotalPaid = 0;

      // 1. Self Transactions (Receive)
      selfReceiveTransactions.forEach((trans) => {
        currentBalance += trans.amount;
        dayTotalReceived += trans.amount;
        dayProcessedTransactions.push({
          ...trans,
          srNo: globalSrNo++,
          runningBalance: currentBalance,
        });
      });

      // 2. Local Sales (Consolidated)
      if (localSales.length > 0) {
        const totalLocalSaleAmount = localSales.reduce(
          (sum, ls) => sum + ls.received_amount,
          0
        );
        currentBalance += totalLocalSaleAmount;
        dayTotalReceived += totalLocalSaleAmount;

        dayProcessedTransactions.push({
          type: "local_sale_consolidated",
          transaction_date: dateStr,
          received_amount: totalLocalSaleAmount,
          runningBalance: currentBalance,
          description: `Local Sale`,
          srNo: globalSrNo++,
        });
      }

      // 3. Self Transactions (Pay)
      selfPayTransactions.forEach((trans) => {
        currentBalance -= trans.amount;
        dayTotalPaid += trans.amount;
        dayProcessedTransactions.push({
          ...trans,
          srNo: globalSrNo++,
          runningBalance: currentBalance,
        });
      });

      // 3.5. Expense Transactions (Pay)
      expenseTransactions.forEach((trans) => {
        currentBalance -= trans.amount;
        dayTotalPaid += trans.amount;
        dayProcessedTransactions.push({
          ...trans,
          srNo: globalSrNo++,
          runningBalance: currentBalance,
        });
      });

      // 4. Opposite Transactions
      oppositeTransactions.forEach((trans) => {
        if (trans.received_by === cashAccId) {
          currentBalance += trans.amount;
          dayTotalReceived += trans.amount;
        } else if (trans.paid_by === cashAccId) {
          currentBalance -= trans.amount;
          dayTotalPaid += trans.amount;
        } else {
          dayTotalReceived += trans.amount;
          dayTotalPaid += trans.amount;
        }

        dayProcessedTransactions.push({
          ...trans,
          srNo: globalSrNo++,
          runningBalance: currentBalance,
        });
      });

      days.push({
        date: dateStr,
        displayDate: new Date(dateStr)
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-"),
        openingBalance: dayOpeningBalance,
        closingBalance: currentBalance,
        transactions: dayProcessedTransactions,
        totalReceived: dayTotalReceived,
        totalPaid: dayTotalPaid,
      });
    });

  return days;
}

function generateReportHTML(
  rawTransactions,
  globalOpeningBalance,
  globalClosingBalance,
  startDate,
  endDate,
  cashAccId
) {
  const processedDays = processTransactions(rawTransactions, globalOpeningBalance, cashAccId);
  
  const formattedStartDate = new Date(startDate).toLocaleDateString("en-GB").replace(/\//g, "-");
  const formattedEndDate = new Date(endDate).toLocaleDateString("en-GB").replace(/\//g, "-");

  let contentHtml = "";

  if (processedDays.length === 0) {
    contentHtml = `
      <div style="text-align: center; padding: 20px; color: #666; border: 1px solid #d1d5db; margin-top: 20px;">
        No transactions found for the selected period.
      </div>
    `;
  } else {
    processedDays.forEach((day) => {
      let rowsHtml = "";

      day.transactions.forEach((trans) => {
        let colReceivedBy = "-";
        let colReceivedAmount = "";
        let colPaidBy = "-";
        let colPaidAmount = "";
        let description = trans.description || "-";

        if (trans.type === "opposite") {
          colReceivedBy = trans.paid_by_account?.account_nam || "-";
          colReceivedAmount = trans.amount.toFixed(2);
          colPaidBy = trans.received_by_account?.account_nam || "-";
          colPaidAmount = trans.amount.toFixed(2);
        } else if (trans.type === "self") {
          if (trans.transaction_type === "receive") {
            colReceivedBy = trans.account?.account_nam || "-";
            colReceivedAmount = trans.amount.toFixed(2);
          } else {
            colPaidBy = trans.account?.account_nam || "-";
            colPaidAmount = trans.amount.toFixed(2);
          }
        } else if (trans.type === "local_sale_consolidated") {
          colReceivedBy = "Local Sales";
          colReceivedAmount = trans.received_amount.toFixed(2);
        } else if (trans.type === "expense") {
          colPaidBy = trans.account?.account_nam || "-";
          colPaidAmount = trans.amount.toFixed(2);
        }

        const balanceColor = trans.runningBalance < 0 ? "#dc2626" : "#16a34a";

        rowsHtml += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 6px; border: 1px solid #d1d5db; text-align: center;">${trans.srNo}</td>
            <td style="padding: 6px; border: 1px solid #d1d5db;">${colReceivedBy}</td>
            <td style="padding: 6px; border: 1px solid #d1d5db; text-align: right;">${colReceivedAmount}</td>
            <td style="padding: 6px; border: 1px solid #d1d5db;">${colPaidBy}</td>
            <td style="padding: 6px; border: 1px solid #d1d5db; text-align: right;">${colPaidAmount}</td>
            <td style="padding: 6px; border: 1px solid #d1d5db;">${description}</td>
            <td style="padding: 6px; border: 1px solid #d1d5db; text-align: right; font-weight: 500; color: ${balanceColor};">
              ${trans.runningBalance.toFixed(2)}
            </td>
          </tr>
        `;
      });

      const dayOpeningColor = day.openingBalance < 0 ? "#dc2626" : "#16a34a";
      const dayClosingColor = day.closingBalance < 0 ? "#dc2626" : "#16a34a";

      contentHtml += `
        <div style="margin-bottom: 25px;">
          <div style="margin-bottom: 8px; padding: 0 4px; display: flex; align-items: center; justify-content: flex-start; gap: 30px;">
            <span style="font-weight: bold; font-size: 14px;">${day.displayDate}</span>
            <span style="font-weight: bold; font-size: 14px;">
              Opening Balance: <span style="color: ${dayOpeningColor};">${day.openingBalance.toFixed(2)}</span>
            </span>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 6px; border: 1px solid #9ca3af; width: 60px; text-align: center;">Sr. No</th>
                <th style="padding: 6px; border: 1px solid #9ca3af; width: 20%; text-align: left;">Name</th>
                <th style="padding: 6px; border: 1px solid #9ca3af; width: 80px; text-align: right;">Receive</th>
                <th style="padding: 6px; border: 1px solid #9ca3af; width: 20%; text-align: left;">Name</th>
                <th style="padding: 6px; border: 1px solid #9ca3af; width: 80px; text-align: right;">Paid</th>
                <th style="padding: 6px; border: 1px solid #9ca3af; text-align: left;">Description</th>
                <th style="padding: 6px; border: 1px solid #9ca3af; width: 90px; text-align: right;">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="background-color: #f9fafb; font-weight: bold;">
                <td colspan="2" style="padding: 6px; border: 1px solid #9ca3af; text-align: right; color: #374151;">Day Total:</td>
                <td style="padding: 6px; border: 1px solid #9ca3af; text-align: right; color: #15803d;">${day.totalReceived.toFixed(2)}</td>
                <td style="padding: 6px; border: 1px solid #9ca3af;"></td>
                <td style="padding: 6px; border: 1px solid #9ca3af; text-align: right; color: #b91c1c;">${day.totalPaid.toFixed(2)}</td>
                <td style="padding: 6px; border: 1px solid #9ca3af; text-align: right; color: #374151;">Closing Balance:</td>
                <td style="padding: 6px; border: 1px solid #9ca3af; text-align: right; color: ${dayClosingColor};">${day.closingBalance.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    });
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 22px; margin: 0 0 5px 0; }
        .header h2 { font-size: 16px; margin: 0 0 5px 0; }
        .header p { font-size: 12px; color: #4b5563; margin: 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BHAGTANWALA POULTRY NETWORK</h1>
        <h2>Balance Sheet/Cash in Hand</h2>
        <p>From: <strong>${formattedStartDate}</strong> To: <strong>${formattedEndDate}</strong></p>
      </div>
      
      ${contentHtml}
    </body>
    </html>
  `;
}
