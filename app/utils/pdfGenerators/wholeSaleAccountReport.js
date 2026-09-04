import puppeteer from "puppeteer";

export async function generateWholeSaleAccountReportPDF(reportData, startDate, endDate, groupBy, accountName) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas", "--disable-gpu"],
    });
    const page = await browser.newPage();
    const htmlContent = generateReportHTML(reportData, startDate, endDate, groupBy, accountName);
    await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "15mm", left: "10mm" },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `<div style="font-size:10px;text-align:center;width:100%;padding:5px;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
      preferCSSPageSize: false,
    });
    return pdfBuffer;
  } catch (error) {
    console.error("Account Report PDF Error:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

function generateReportHTML(reportData, startDate, endDate, groupBy, accountName) {
  const formatPeriod = (period, groupType) => {
    if (groupType === "date") {
      return new Date(period).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
    } else if (groupType === "month") {
      const [year, month] = period.split("-");
      return new Date(year, parseInt(month) - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    } else if (groupType === "year") {
      return period;
    }
    return period;
  };

  const getPeriodHeader = () => {
    if (groupBy === "date") return "Date";
    if (groupBy === "month") return "Month";
    if (groupBy === "year") return "Year";
    return "Period";
  };

  const results = reportData.results || [];
  const grandTotalWeight = reportData.grandTotalWeight || 0;
  const grandTotalPurchase = reportData.grandTotalPurchase || 0;
  const grandTotalSale = reportData.grandTotalSale || 0;
  const netProfit = reportData.netProfit || 0;

  let tableContent = "";

  if (results.length === 0) {
    tableContent = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#666;">No data found for the selected period</td></tr>`;
  } else {
    results.forEach((row) => {
      const profit = row.profit_loss > 0 ? row.profit_loss : 0;
      const loss = row.profit_loss < 0 ? Math.abs(row.profit_loss) : 0;
      tableContent += `
        <tr style="font-size:11px;border-bottom:1px solid #e5e7eb;">
          <td style="padding:6px;border:1px solid #d1d5db;">${formatPeriod(row.period, groupBy)}</td>
          <td style="padding:6px;border:1px solid #d1d5db;text-align:right;">${(row.weight || 0).toFixed(2)}</td>
          <td style="padding:6px;border:1px solid #d1d5db;text-align:right;">${row.purchase_amount.toFixed(2)}</td>
          <td style="padding:6px;border:1px solid #d1d5db;text-align:right;">${row.sale_amount.toFixed(2)}</td>
          <td style="padding:6px;border:1px solid #d1d5db;text-align:right;font-weight:600;">${profit.toFixed(2)}</td>
          <td style="padding:6px;border:1px solid #d1d5db;text-align:right;font-weight:600;">${loss.toFixed(2)}</td>
        </tr>`;
    });

    tableContent += `
      <tr style="font-size:12px;font-weight:bold;background-color:#eef2ff;">
        <td style="padding:8px;border:1px solid #9ca3af;">Grand Total:</td>
        <td style="padding:8px;border:1px solid #9ca3af;text-align:right;">${grandTotalWeight.toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #9ca3af;text-align:right;">${grandTotalPurchase.toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #9ca3af;text-align:right;">${grandTotalSale.toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #9ca3af;text-align:right;">${netProfit > 0 ? netProfit.toFixed(2) : "0.00"}</td>
        <td style="padding:8px;border:1px solid #9ca3af;text-align:right;">${netProfit < 0 ? Math.abs(netProfit).toFixed(2) : "0.00"}</td>
      </tr>
      <tr style="font-size:14px;font-weight:bold;background-color:#f3f4f6;">
        <td colspan="4" style="padding:10px;border:1px solid #9ca3af;text-align:right;">Net Profit:</td>
        <td style="padding:10px;border:1px solid #9ca3af;text-align:right;color:${netProfit >= 0 ? "#16a34a" : "#dc2626"};">${netProfit.toFixed(2)}</td>
        <td style="padding:10px;border:1px solid #9ca3af;"></td>
      </tr>`;
  }

  const formattedStartDate = new Date(startDate).toLocaleDateString("en-GB").replace(/\//g, "-");
  const formattedEndDate = new Date(endDate).toLocaleDateString("en-GB").replace(/\//g, "-");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin:0;padding:0;box-sizing:border-box; }
      body { font-family:Arial,sans-serif; }
      .header { text-align:center;margin-bottom:20px; }
      .header h1 { font-size:22px;margin:0 0 5px 0; }
      .header h2 { font-size:18px;margin:0 0 5px 0;text-transform:uppercase; }
      .header p { font-size:12px;color:#4b5563;margin:0; }
      table { width:100%;border-collapse:collapse;margin-top:10px; }
      th { background-color:#f3f4f6;border:1px solid #9ca3af;padding:8px;font-size:12px;font-weight:bold;text-align:center; }
      tr { page-break-inside:avoid; }
    </style></head><body>
    <div class="header">
      <h1>BHAGTANWALA POULTRY NETWORK</h1>
      <h2>ACCOUNT WHOLESALE REPORT</h2>
      <p>Account: <strong>${accountName}</strong></p>
      <p>From: <strong>${formattedStartDate}</strong> To: <strong>${formattedEndDate}</strong> | Grouped by: <strong>${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</strong></p>
    </div>
    <table>
      <thead><tr>
        <th>${getPeriodHeader().toUpperCase()}</th>
        <th>WEIGHT</th>
        <th>WHOLE SALE PURCHASE</th>
        <th>WHOLE SALE AMOUNT</th>
        <th>PROFIT</th>
        <th>LOSS</th>
      </tr></thead>
      <tbody>${tableContent}</tbody>
    </table>
    </body></html>`;
}
