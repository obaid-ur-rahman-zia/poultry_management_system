import puppeteer from "puppeteer";

export async function generateSubheadTrialBalanceReportPDF(reportData, endDate) {
  let browser;

  try {
    console.log("Starting Subhead Trial Balance Report PDF generation...");

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
    const htmlContent = generateReportHTML(reportData, endDate);

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

function generateReportHTML(reportData, endDate) {
  const getDateRangeText = () => {
    if (endDate) return `As of ${new Date(endDate).toLocaleDateString("en-GB").replace(/\//g, "-")}`;
    return `All Time Records`;
  };

  const formatCurrency = (amount, type = 'none') => {
    const val = amount || 0;
    const formatted = new Intl.NumberFormat("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(val));

    if (type === 'debit') return val !== 0 ? `${formatted} Dr` : formatted;
    if (type === 'credit') return val !== 0 ? `${formatted} Cr` : formatted;
    if (type === 'balance') return `${formatted} ${val >= 0 ? "Dr" : "Cr"}`;

    return formatted;
  };

  let contentHtml = "";

  if (!reportData || !reportData.details || reportData.details.length === 0) {
    contentHtml = `
      <div style="text-align: center; padding: 20px; color: #666; border: 1px solid #d1d5db; margin-top: 20px;">
        No data found for the selected period.
      </div>
    `;
  } else {
    reportData.details.forEach((subhead) => {
      if (subhead.accounts.length === 0) return;

      let rowsHtml = "";
      subhead.accounts.forEach((acc) => {
        const limitExceeded = acc.credit_limit > 0 && acc.balance > acc.credit_limit;
        
        let accountNameHtml = acc.name;
        if (limitExceeded) {
          accountNameHtml += ` <span style="font-size: 8px; font-weight: bold; color: #dc2626; background-color: #fee2e2; padding: 2px 4px; border-radius: 2px; border: 1px solid #fecaca; margin-left: 4px;">LIMIT EXCEEDED</span>`;
        }

        const trStyle = limitExceeded 
          ? "border-bottom: 1px solid #e5e7eb; background-color: #fef2f2; page-break-inside: avoid;" 
          : "border-bottom: 1px solid #e5e7eb; page-break-inside: avoid;";
        const nameColor = limitExceeded ? "#b91c1c" : "#111827";

        rowsHtml += `
          <tr style="${trStyle}">
            <td style="padding: 6px; border: 1px solid #d1d5db; font-weight: 500; color: ${nameColor};">${accountNameHtml}</td>
            <td style="padding: 6px; border: 1px solid #d1d5db; text-align: right;">${acc.contact || "-"}</td>
            <td style="padding: 6px; border: 1px solid #d1d5db; text-align: right;">${formatCurrency(acc.total_debit, 'debit')}</td>
            <td style="padding: 6px; border: 1px solid #d1d5db; text-align: right;">${formatCurrency(acc.total_credit, 'credit')}</td>
            <td style="padding: 6px; border: 1px solid #d1d5db; text-align: right; font-weight: 600;">${formatCurrency(acc.balance, 'balance')}</td>
          </tr>
        `;
      });

      contentHtml += `
        <div style="margin-bottom: 25px;">
          <div style="margin-bottom: 6px; display: flex; align-items: center; justify-content: flex-start; gap: 8px;">
            <span style="font-size: 16px; font-weight: 800; color: #1f2937;">${subhead.subhead_nam}</span>
            <span style="font-size: 10px; border: 1px solid #e5e7eb; border-radius: 4px; padding: 2px 6px;">${subhead.accounts.length} Accounts</span>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <colgroup>
              <col style="width: 40%;" />
              <col style="width: 15%;" />
              <col style="width: 15%;" />
              <col style="width: 15%;" />
              <col style="width: 15%;" />
            </colgroup>
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 6px; border: 1px solid #9ca3af; text-align: left;">Account Name</th>
                <th style="padding: 6px; border: 1px solid #9ca3af; text-align: right;">Contact</th>
                <th style="padding: 6px; border: 1px solid #9ca3af; text-align: right;">Total Debit</th>
                <th style="padding: 6px; border: 1px solid #9ca3af; text-align: right;">Total Credit</th>
                <th style="padding: 6px; border: 1px solid #9ca3af; text-align: right;">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div style="background-color: #f3f4f6; border: 2px solid #e5e7eb; padding: 8px; font-weight: bold; display: grid; grid-template-columns: 40% 15% 15% 15% 15%; font-size: 12px; margin-top: -1px;">
            <div style="text-align: left;">Total</div>
            <div></div>
            <div style="text-align: right; color: #15803d;">${formatCurrency(subhead.total_debit, 'debit')}</div>
            <div style="text-align: right; color: #b91c1c;">${formatCurrency(subhead.total_credit, 'credit')}</div>
            <div style="text-align: right; color: #1d4ed8;">${formatCurrency(subhead.total_balance, 'balance')}</div>
          </div>
        </div>
      `;
    });

    if (reportData.wholeSaleProfit) {
      contentHtml += `
        <div style="margin-top: 30px; border-top: 2px solid #9ca3af; padding-top: 15px; page-break-inside: avoid;">
          <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #1f2937; text-transform: uppercase;">Whole Sale Profit</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #d1d5db;">
            <thead>
              <tr style="background-color: #e5e7eb; border-bottom: 2px solid #9ca3af;">
                <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Description</th>
                <th style="padding: 8px; border: 1px solid #d1d5db; text-align: right; color: #166534;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #d1d5db; background-color: #ffffff;">
                <td style="padding: 8px; border: 1px solid #d1d5db; font-weight: 500;">Balance of Income Acc under Income (Credit)</td>
                <td style="padding: 8px; border: 1px solid #d1d5db; text-align: right; font-weight: bold; color: #15803d;">${formatCurrency(reportData.wholeSaleProfit.income_acc_credit, 'credit')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db; background-color: #ffffff;">
                <td style="padding: 8px; border: 1px solid #d1d5db; font-weight: 500;">Total Expense Head Balance</td>
                <td style="padding: 8px; border: 1px solid #d1d5db; text-align: right; font-weight: bold; color: #b91c1c;">${formatCurrency(reportData.wholeSaleProfit.expense_head_debit, 'debit')}</td>
              </tr>
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">Whole Sale Profit</td>
                <td style="padding: 10px; border: 1px solid #d1d5db; text-align: right; font-weight: bold; font-size: 14px; color: #1d4ed8;">${formatCurrency(reportData.wholeSaleProfit.profit, 'balance')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    if (reportData.conclusion) {
      contentHtml += `
        <div style="margin-top: 30px; border-top: 2px solid #9ca3af; padding-top: 15px; page-break-inside: avoid;">
          <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #1f2937; text-transform: uppercase;">Grand Conclusion</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #d1d5db;">
            <thead>
              <tr style="background-color: #e5e7eb; border-bottom: 2px solid #9ca3af;">
                <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Description</th>
                <th style="padding: 8px; border: 1px solid #d1d5db; text-align: right; color: #166534;">Total Debit</th>
                <th style="padding: 8px; border: 1px solid #d1d5db; text-align: right; color: #991b1b;">Total Credit</th>
                <th style="padding: 8px; border: 1px solid #d1d5db; text-align: right; color: #1e40af;">Total Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background-color: #ffffff;">
                <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">Final Aggregates</td>
                <td style="padding: 10px; border: 1px solid #d1d5db; text-align: right; font-weight: bold; font-size: 14px; color: #15803d;">${formatCurrency(reportData.conclusion.total_debit, 'debit')}</td>
                <td style="padding: 10px; border: 1px solid #d1d5db; text-align: right; font-weight: bold; font-size: 14px; color: #b91c1c;">${formatCurrency(reportData.conclusion.total_credit, 'credit')}</td>
                <td style="padding: 10px; border: 1px solid #d1d5db; text-align: right; font-weight: bold; font-size: 14px; color: #1d4ed8;">${formatCurrency(reportData.conclusion.total_balance, 'balance')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }
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
        .header h2 { font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase; }
        .header p { font-size: 12px; color: #4b5563; margin: 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BHAGTANWALA POULTRY NETWORK</h1>
        <h2>OVERALL BUSINESS REPORT</h2>
        <p>${getDateRangeText()}</p>
      </div>
      
      ${contentHtml}
    </body>
    </html>
  `;
}
